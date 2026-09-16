import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BackupService } from './backup.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('admin/backup')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

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
