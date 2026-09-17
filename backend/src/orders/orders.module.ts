import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EmailModule } from '../email/email.module';
import { MetaModule } from '../meta/meta.module';
import { GA4Module } from '../ga4/ga4.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [EmailModule, MetaModule, GA4Module, NotificationModule],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
