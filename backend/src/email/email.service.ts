import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async sendMail(to: string, subject: string, html: string) {
    return this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@trendora.com',
      to,
      subject,
      html,
    });
  }

  async sendOrderConfirmation(email: string, name: string, order: any) {
    const itemsHtml = order.items
      .map(
        (item: any) =>
          `<tr><td>${item.product?.name ?? 'Product'}</td><td>${item.quantity}</td><td>$${Number(item.price).toFixed(2)}</td></tr>`,
      )
      .join('');

    const html = `
      <h2>Order Confirmation - #${order.id.slice(-8).toUpperCase()}</h2>
      <p>Hi ${name}, thank you for your order!</p>
      <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p><strong>Subtotal:</strong> $${Number(order.subtotal).toFixed(2)}</p>
      ${order.discount > 0 ? `<p><strong>Discount:</strong> -$${Number(order.discount).toFixed(2)}</p>` : ''}
      <p><strong>Total:</strong> $${Number(order.total).toFixed(2)}</p>
      <p>We'll notify you when your order ships!</p>
    `;

    return this.sendMail(email, `Order Confirmed #${order.id.slice(-8).toUpperCase()}`, html);
  }

  async sendShippingUpdate(email: string, name: string, order: any) {
    const html = `
      <h2>Your Order Has Shipped!</h2>
      <p>Hi ${name}, great news! Your order #${order.id.slice(-8).toUpperCase()} has been shipped.</p>
      <p>You'll receive it soon. Thank you for shopping with Trendora!</p>
    `;
    return this.sendMail(email, `Your Order Has Shipped - #${order.id.slice(-8).toUpperCase()}`, html);
  }

  async sendInquiryResponse(email: string, name: string, subject: string, response: string) {
    const html = `
      <h2>Response to Your Inquiry</h2>
      <p>Hi ${name},</p>
      <p>Thank you for contacting Trendora. Regarding your inquiry "<strong>${subject}</strong>":</p>
      <blockquote style="border-left:3px solid #ccc;padding-left:12px;">${response}</blockquote>
      <p>If you have further questions, feel free to contact us.</p>
    `;
    return this.sendMail(email, `Re: ${subject}`, html);
  }
}
