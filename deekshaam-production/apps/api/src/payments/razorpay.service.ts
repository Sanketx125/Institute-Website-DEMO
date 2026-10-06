import crypto from 'crypto';
import { config } from '../config';

export interface RazorpayOrderOptions {
  amount: number; // in paise
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
  isSimulated: boolean;
}

export class RazorpayService {
  private isConfiguredReal(): boolean {
    const keyId = config.razorpay.keyId || '';
    const secret = config.razorpay.keySecret || '';
    return (
      keyId.startsWith('rzp_') &&
      !keyId.includes('placeholder') &&
      secret.length >= 10 &&
      !secret.includes('placeholder') &&
      process.env.NODE_ENV !== 'test'
    );
  }

  public async createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrderResult> {
    if (this.isConfiguredReal()) {
      try {
        const credentials = Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64');
        const res = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({
            amount: options.amount,
            currency: options.currency || 'INR',
            receipt: options.receipt,
            notes: options.notes,
          }),
        });

        const data: any = await res.json();
        if (!res.ok) {
          throw new Error(data.error?.description || data.error?.message || `Razorpay order creation failed: HTTP ${res.status}`);
        }

        return {
          id: data.id,
          amount: data.amount,
          currency: data.currency,
          receipt: data.receipt,
          status: data.status,
          isSimulated: false,
        };
      } catch (err: any) {
        console.error('[RAZORPAY ERROR] Upstream API call failed:', err.message);
        throw err;
      }
    }

    // High-fidelity sandbox order generation for test and local developer mode
    const simulatedOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    return {
      id: simulatedOrderId,
      amount: options.amount,
      currency: options.currency || 'INR',
      receipt: options.receipt,
      status: 'created',
      isSimulated: true,
    };
  }

  public generateSignature(orderId: string, paymentId: string): string {
    return crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
  }

  public verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const generatedSignature = this.generateSignature(orderId, paymentId);

    const expected = Buffer.from(generatedSignature);
    const provided = Buffer.from(signature);
    if (expected.length !== provided.length) return false;
    return crypto.timingSafeEqual(expected, provided);
  }

  public verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const generated = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(bodyStr)
      .digest('hex');

    const expected = Buffer.from(generated);
    const provided = Buffer.from(signature);
    if (expected.length !== provided.length) return false;
    return crypto.timingSafeEqual(expected, provided);
  }
}

export const razorpayService = new RazorpayService();
