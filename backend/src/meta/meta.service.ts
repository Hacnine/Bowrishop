import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface MetaEventData {
  eventName: 'Purchase' | 'AddToCart' | 'ViewContent' | 'InitiateCheckout' | 'PageView';
  eventId?: string;        // deduplication এর জন্য — browser pixel এর eventID এর সাথে match করাবো
  sourceUrl?: string;
  userEmail?: string;
  userPhone?: string;
  userName?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;            // _fbp cookie
  fbc?: string;            // _fbc cookie (fb click id)
  // Purchase specific
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentType?: string;
  orderId?: string;
}

@Injectable()
export class MetaService {
  private readonly logger = new Logger(MetaService.name);
  private readonly pixelId: string;
  private readonly accessToken: string;
  private readonly apiVersion = 'v21.0';

  constructor(private config: ConfigService) {
    this.pixelId = this.config.get<string>('META_PIXEL_ID') ?? '2241909363253246';
    this.accessToken = this.config.get<string>('META_CONVERSIONS_API_TOKEN') ?? '';
  }

  // SHA256 hash — Meta requires hashed PII
  private hash(value: string): string {
    return crypto
      .createHash('sha256')
      .update(value.trim().toLowerCase())
      .digest('hex');
  }

  private hashPhone(phone: string): string {
    // Remove spaces, dashes, +880 prefix — normalize to local format
    const normalized = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+880/, '880').replace(/^0/, '880');
    return this.hash(normalized);
  }

  async sendEvent(data: MetaEventData): Promise<void> {
    if (!this.accessToken) {
      this.logger.warn('META_CONVERSIONS_API_TOKEN not set — skipping server event');
      return;
    }

    const eventTime = Math.floor(Date.now() / 1000);
    const eventId = data.eventId ?? crypto.randomUUID();

    // User data — সব PII hash করতে হবে
    const userData: Record<string, string | string[]> = {};
    if (data.userEmail) userData['em'] = [this.hash(data.userEmail)];
    if (data.userPhone) userData['ph'] = [this.hashPhone(data.userPhone)];
    if (data.fbp) userData['fbp'] = data.fbp;
    if (data.fbc) userData['fbc'] = data.fbc;
    if (data.clientIpAddress) userData['client_ip_address'] = data.clientIpAddress;
    if (data.clientUserAgent) userData['client_user_agent'] = data.clientUserAgent;

    // Custom data
    const customData: Record<string, unknown> = {};
    if (data.value !== undefined) customData['value'] = data.value;
    if (data.currency) customData['currency'] = data.currency;
    if (data.contentIds) customData['content_ids'] = data.contentIds;
    if (data.contentType) customData['content_type'] = data.contentType;
    if (data.orderId) customData['order_id'] = data.orderId;

    const payload = {
      data: [
        {
          event_name: data.eventName,
          event_time: eventTime,
          event_id: eventId,       // browser pixel এর eventID এর সাথে match → deduplication
          event_source_url: data.sourceUrl ?? 'https://www.bowrishop.com',
          action_source: 'website',
          user_data: userData,
          custom_data: customData,
        },
      ],
      // test_event_code: 'TEST12345', // debugging এর সময় Meta Events Manager থেকে code নিয়ে এখানে দাও
    };

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events?access_token=${this.accessToken}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json() as any;

      if (!response.ok) {
        this.logger.error(`Meta Conversions API error: ${JSON.stringify(result)}`);
      } else {
        this.logger.log(`Meta event sent: ${data.eventName} | eventId: ${eventId} | events_received: ${result.events_received}`);
      }
    } catch (err) {
      // Meta API failure কখনো order flow break করবে না
      this.logger.error('Failed to send Meta event', err);
    }
  }

  // Convenience methods
  async trackPurchase(params: {
    orderId: string;
    total: number;
    productIds: string[];
    userEmail?: string;
    userPhone?: string;
    clientIp?: string;
    userAgent?: string;
    fbp?: string;
    fbc?: string;
    sourceUrl?: string;
    eventId?: string;
  }) {
    await this.sendEvent({
      eventName: 'Purchase',
      eventId: params.eventId,
      orderId: params.orderId,
      value: params.total,
      currency: 'BDT',
      contentIds: params.productIds,
      contentType: 'product',
      userEmail: params.userEmail,
      userPhone: params.userPhone,
      clientIpAddress: params.clientIp,
      clientUserAgent: params.userAgent,
      fbp: params.fbp,
      fbc: params.fbc,
      sourceUrl: params.sourceUrl,
    });
  }

  async trackAddToCart(params: {
    productId: string;
    value: number;
    userEmail?: string;
    clientIp?: string;
    userAgent?: string;
    fbp?: string;
    fbc?: string;
    eventId?: string;
  }) {
    await this.sendEvent({
      eventName: 'AddToCart',
      eventId: params.eventId,
      value: params.value,
      currency: 'BDT',
      contentIds: [params.productId],
      contentType: 'product',
      userEmail: params.userEmail,
      clientIpAddress: params.clientIp,
      clientUserAgent: params.userAgent,
      fbp: params.fbp,
      fbc: params.fbc,
    });
  }
}
