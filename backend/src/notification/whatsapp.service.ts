import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  async sendAdminOrderNotification(order: {
    id: string;
    total: number | string;
    customerName: string;
    customerPhone?: string;
    itemCount: number;
  }): Promise<void> {
    const phone = process.env.ADMIN_WHATSAPP_NUMBER;
    const apiKey = process.env.CALLMEBOT_API_KEY;

    if (!phone || !apiKey) {
      this.logger.warn('[whatsapp] ADMIN_WHATSAPP_NUMBER or CALLMEBOT_API_KEY not set — skipping');
      return;
    }

    const frontendUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bowrishop.com';

    const message = [
      `🛍️ *নতুন অর্ডার!*`,
      `📦 Order ID: ${order.id.slice(-8).toUpperCase()}`,
      `👤 Customer: ${order.customerName}`,
      order.customerPhone ? `📞 Phone: ${order.customerPhone}` : null,
      `🛒 Items: ${order.itemCount}টি`,
      `💰 Total: ৳${Number(order.total).toFixed(2)}`,
      `🕐 Time: ${new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })}`,
      `🔗 ${frontendUrl}/admin/orders/${order.id}`,
    ]
      .filter(Boolean)
      .join('\n');

    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        this.logger.log(`[whatsapp] Admin notified for order ${order.id}`);
      } else {
        this.logger.error(`[whatsapp] CallMeBot returned ${res.status}`);
      }
    } catch (err) {
      this.logger.error('[whatsapp] Failed to send notification', err);
    }
  }
}
