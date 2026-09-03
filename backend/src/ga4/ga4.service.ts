import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface GA4EventParams {
  [key: string]: unknown;
}

interface GA4Event {
  name: string;
  params?: GA4EventParams;
}

@Injectable()
export class GA4Service {
  private readonly logger = new Logger(GA4Service.name);
  private readonly measurementId: string;
  private readonly apiSecret: string;
  private readonly apiVersion = 'v2';

  constructor(private config: ConfigService) {
    this.measurementId = this.config.get<string>('GA4_MEASUREMENT_ID') ?? '';
    this.apiSecret = this.config.get<string>('GA4_API_SECRET') ?? '';
  }

  private async sendEvents(clientId: string, events: GA4Event[]): Promise<void> {
    if (!this.measurementId || !this.apiSecret) {
      this.logger.warn('GA4_MEASUREMENT_ID or GA4_API_SECRET not set — skipping');
      return;
    }

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;

    const payload = {
      client_id: clientId,
      timestamp_micros: Date.now() * 1000,
      events,
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        this.logger.error(`GA4 Measurement Protocol error: ${res.status}`);
      } else {
        this.logger.log(`GA4 events sent: ${events.map(e => e.name).join(', ')} | client: ${clientId}`);
      }
    } catch (err) {
      // GA4 failure কখনো main flow break করবে না
      this.logger.error('Failed to send GA4 event', err);
    }
  }

  // client_id — browser থেকে _ga cookie parse করে পাঠাও
  // format: GA1.1.XXXXXXXXXX.XXXXXXXXXX → শেষ দুটো part নাও
  private parseClientId(gaCookie?: string): string {
    if (!gaCookie) return crypto.randomUUID();
    const parts = gaCookie.split('.');
    if (parts.length >= 4) return `${parts[2]}.${parts[3]}`;
    return gaCookie;
  }

  async trackPurchase(params: {
    orderId: string;
    value: number;
    items: { id: string; name: string; price: number; quantity: number }[];
    gaCookie?: string;   // _ga cookie from browser
    sessionId?: string;  // _ga_XXXXXX cookie থেকে session id
  }) {
    const clientId = this.parseClientId(params.gaCookie);

    await this.sendEvents(clientId, [{
      name: 'purchase',
      params: {
        transaction_id: params.orderId,
        currency: 'BDT',
        value: params.value,
        items: params.items.map(i => ({
          item_id: i.id,
          item_name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        session_id: params.sessionId,
      },
    }]);
  }

  async trackAddToCart(params: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    gaCookie?: string;
  }) {
    const clientId = this.parseClientId(params.gaCookie);

    await this.sendEvents(clientId, [{
      name: 'add_to_cart',
      params: {
        currency: 'BDT',
        value: params.price * params.quantity,
        items: [{
          item_id: params.productId,
          item_name: params.productName,
          price: params.price,
          quantity: params.quantity,
        }],
      },
    }]);
  }

  async trackBeginCheckout(params: {
    value: number;
    items: { id: string; name: string; price: number; quantity: number }[];
    gaCookie?: string;
  }) {
    const clientId = this.parseClientId(params.gaCookie);

    await this.sendEvents(clientId, [{
      name: 'begin_checkout',
      params: {
        currency: 'BDT',
        value: params.value,
        items: params.items.map(i => ({
          item_id: i.id,
          item_name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      },
    }]);
  }
}
