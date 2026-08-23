import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EmailModule } from '../email/email.module';
import { MetaModule } from '../meta/meta.module';

@Module({
  imports: [EmailModule, MetaModule],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
