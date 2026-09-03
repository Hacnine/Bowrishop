import { Module } from '@nestjs/common';
import { GA4Service } from './ga4.service';

@Module({
  providers: [GA4Service],
  exports: [GA4Service],
})
export class GA4Module {}
