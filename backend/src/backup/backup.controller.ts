import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  // Manual backup trigger
  @Post('create')
  @HttpCode(200)
  async createBackup() {
    const result = await this.backupService.triggerManualBackup();
    return {
      message: 'Backup created and uploaded successfully',
      url: result.url,
      rowCount: result.rowCount,
    };
  }

  // Restore from Cloudinary URL
  @Post('restore')
  @HttpCode(200)
  async restoreBackup(@Body('url') url: string) {
    if (!url) {
      return { message: 'Backup URL is required' };
    }
    const result = await this.backupService.restoreFromUrl(url);
    return {
      message: 'Restore completed',
      restored: result.restored,
      skipped: result.skipped,
    };
  }
}
