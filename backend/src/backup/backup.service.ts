import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  // Last backup এর DB row count track করবো
  private lastBackupCount = 0;
  private lastBackupTime: Date | null = null;

  constructor(private readonly prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // প্রতি 5 দিনে একবার check করবে
  @Cron('0 3 */5 * *') // প্রতি 5 দিন, রাত 3টায়
  async runScheduledBackup() {
    this.logger.log('[backup] Scheduled check started');

    try {
      const currentCount = await this.getTotalRowCount();
      this.logger.log(
        `[backup] Current row count: ${currentCount}, Last backup count: ${this.lastBackupCount}`,
      );

      // Data change হয়নি → skip
      if (currentCount === this.lastBackupCount && this.lastBackupTime !== null) {
        this.logger.log('[backup] No new data since last backup — skipping');
        return;
      }

      await this.createAndUploadBackup();
      this.lastBackupCount = currentCount;
      this.lastBackupTime = new Date();
    } catch (err) {
      this.logger.error('[backup] Scheduled backup failed', err);
    }
  }

  // সব table এর মোট row count
  private async getTotalRowCount(): Promise<number> {
    const tables = [
      'users', 'products', 'orders', 'order_items',
      'categories', 'reviews', 'coupons', 'cart_items',
      'wishlist_items', 'inquiries', 'product_variants',
    ];

    let total = 0;
    for (const table of tables) {
      try {
        const result = await this.prisma.$queryRawUnsafe<[{ count: bigint }]>(
          `SELECT COUNT(*) as count FROM "${table}"`,
        );
        total += Number(result[0].count);
      } catch {
        // Table না থাকলে skip
      }
    }
    return total;
  }

  // pg_dump দিয়ে backup নেবে এবং Cloudinary তে upload করবে
  async createAndUploadBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.sql`;
    const filePath = path.join('/tmp', fileName);

    this.logger.log(`[backup] Creating backup: ${fileName}`);

    // DATABASE_URL parse করো
    const dbUrl = process.env.DATABASE_URL!;
    const url = new URL(dbUrl);

    const pgDumpEnv = {
      ...process.env,
      PGPASSWORD: url.password,
    };

    // pg_dump — current schema এর সাথে compatible data only
    const dumpCmd = [
      'pg_dump',
      `--host=${url.hostname}`,
      `--port=${url.port || 5432}`,
      `--username=${url.username}`,
      `--dbname=${url.pathname.replace('/', '')}`,
      '--format=plain',       // plain SQL
      '--no-owner',           // restore করার সময় owner issue এড়াতে
      '--no-privileges',      // privilege issue এড়াতে
      '--data-only',          // শুধু data, schema নয়
      '--no-comments',
      `--file=${filePath}`,
    ].join(' ');

    try {
      await execAsync(dumpCmd, { env: pgDumpEnv });
      this.logger.log(`[backup] pg_dump completed: ${filePath}`);
    } catch (err: any) {
      this.logger.error('[backup] pg_dump failed', err.message);
      throw err;
    }

    // File size check
    const stats = fs.statSync(filePath);
    this.logger.log(`[backup] Backup file size: ${(stats.size / 1024).toFixed(1)} KB`);

    // Cloudinary তে upload — raw file হিসেবে
    const uploadResult = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload(
        filePath,
        {
          folder: 'trendora-backups',
          public_id: `backup-${timestamp}`,
          resource_type: 'raw',
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        },
      );
    });

    this.logger.log(`[backup] Uploaded to Cloudinary: ${uploadResult}`);

    // Local temp file মুছে দাও
    fs.unlinkSync(filePath);

    return uploadResult;
  }

  // Manual backup trigger — admin এ কাজে লাগবে
  async triggerManualBackup(): Promise<{ url: string; rowCount: number }> {
    const rowCount = await this.getTotalRowCount();
    const url = await this.createAndUploadBackup();
    this.lastBackupCount = rowCount;
    this.lastBackupTime = new Date();
    return { url, rowCount };
  }

  // Restore — current schema এর সাথে match করে শুধু সেই data restore করবে
  async restoreFromUrl(backupUrl: string): Promise<{ restored: string[]; skipped: string[] }> {
    this.logger.log(`[backup] Downloading backup from: ${backupUrl}`);

    // Cloudinary থেকে SQL download
    const response = await fetch(backupUrl);
    if (!response.ok) throw new Error(`Failed to download backup: ${response.status}`);
    const sqlContent = await response.text();

    // Current schema এর tables গুলো বের করো
    const existingTables = await this.getExistingTables();
    this.logger.log(`[backup] Existing tables: ${existingTables.join(', ')}`);

    const restored: string[] = [];
    const skipped: string[] = [];

    // SQL কে table-wise block এ ভাগ করো
    // COPY table_name ... বা INSERT INTO table_name এর block গুলো parse করো
    const tableBlocks = this.parseSqlByTable(sqlContent);

    for (const [tableName, sql] of Object.entries(tableBlocks)) {
      if (!existingTables.includes(tableName)) {
        this.logger.warn(`[backup] Table "${tableName}" not in current schema — skipping`);
        skipped.push(tableName);
        continue;
      }

      try {
        // Column compatibility check
        const compatible = await this.checkColumnCompatibility(tableName, sql);
        if (!compatible) {
          this.logger.warn(`[backup] Table "${tableName}" has incompatible columns — skipping`);
          skipped.push(tableName);
          continue;
        }

        // Restore এর আগে existing data clear করো
        await this.prisma.$executeRawUnsafe(`DELETE FROM "${tableName}"`);

        // SQL execute করো
        await this.prisma.$executeRawUnsafe(sql);
        this.logger.log(`[backup] Restored table: ${tableName}`);
        restored.push(tableName);
      } catch (err: any) {
        this.logger.error(`[backup] Failed to restore "${tableName}": ${err.message}`);
        skipped.push(tableName);
      }
    }

    return { restored, skipped };
  }

  // DB এর existing tables
  private async getExistingTables(): Promise<string[]> {
    const result = await this.prisma.$queryRaw<[{ tablename: string }]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
    `;
    return (result as any[]).map((r) => r.tablename);
  }

  // SQL content কে table-wise block এ parse করো
  private parseSqlByTable(sql: string): Record<string, string> {
    const blocks: Record<string, string> = {};
    const lines = sql.split('\n');
    let currentTable = '';
    let currentBlock: string[] = [];

    for (const line of lines) {
      // COPY statement detect
      const copyMatch = line.match(/^COPY "?(\w+)"?\s/);
      if (copyMatch) {
        if (currentTable && currentBlock.length) {
          blocks[currentTable] = currentBlock.join('\n');
        }
        currentTable = copyMatch[1];
        currentBlock = [line];
        continue;
      }

      // INSERT INTO detect
      const insertMatch = line.match(/^INSERT INTO "?(\w+)"?\s/);
      if (insertMatch) {
        const table = insertMatch[1];
        if (!blocks[table]) blocks[table] = '';
        blocks[table] += line + '\n';
        continue;
      }

      if (currentTable) {
        currentBlock.push(line);
        // COPY block শেষ হয় `\.` দিয়ে
        if (line.trim() === '\\.') {
          blocks[currentTable] = currentBlock.join('\n');
          currentTable = '';
          currentBlock = [];
        }
      }
    }

    return blocks;
  }

  // Table এর columns backup SQL এর সাথে compatible কিনা check
  private async checkColumnCompatibility(tableName: string, sql: string): Promise<boolean> {
    try {
      const dbColumns = await this.prisma.$queryRawUnsafe<[{ column_name: string }]>(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = $1 AND table_schema = 'public'`,
        tableName,
      );
      const existingCols = (dbColumns as any[]).map((c) => c.column_name);

      // SQL এর COPY header থেকে columns বের করো
      const copyHeaderMatch = sql.match(/^COPY \w+ \(([^)]+)\)/m);
      if (!copyHeaderMatch) return true; // parse করতে না পারলে try করো

      const backupCols = copyHeaderMatch[1].split(',').map((c) => c.trim().replace(/"/g, ''));

      // Backup এর সব column current schema তে আছে কিনা
      const incompatible = backupCols.filter((col) => !existingCols.includes(col));
      if (incompatible.length > 0) {
        this.logger.warn(
          `[backup] "${tableName}" has unknown columns in backup: ${incompatible.join(', ')}`,
        );
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}
