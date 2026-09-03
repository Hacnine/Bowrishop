import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EmailModule } from '../email/email.module';
import { MetaModule } from '../meta/meta.module';
import { GA4Module } from '../ga4/ga4.module';

@Module({
  imports: [EmailModule, MetaModule, GA4Module],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
