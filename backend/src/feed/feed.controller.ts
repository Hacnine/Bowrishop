import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FeedService } from './feed.service';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  /**
   * Facebook Product Catalog Feed
   * Facebook এই URL daily crawl করে catalog update রাখে
   * URL: https://www.bowrishop.com/api/feed/facebook
   */
  @Get('facebook')
  @SkipThrottle() // Facebook crawler throttle করবে না
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600') // 1 hour cache
  @ApiOperation({ summary: 'Facebook Dynamic Ads product feed (XML)' })
  async getFacebookFeed(): Promise<string> {
    return this.feedService.getFacebookFeed();
  }

  /**
   * Feed stats — কতটা product feed এ আছে
   */
  @Get('stats')
  @ApiOperation({ summary: 'Feed statistics' })
  async getFeedStats() {
    return this.feedService.getFeedStats();
  }
}
