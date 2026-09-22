import { Request, Response } from 'express';
import crypto from 'crypto';
import { createPaymentOrderSchema, verifyPaymentSignatureSchema } from '@deekshaam/validation';
import { memoryDb } from '../database/client';
import { recordAuditLog } from '../middleware/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { config } from '../config';

export function createPaymentOrder(req: Request, res: Response) {
  const validated = createPaymentOrderSchema.parse(req.body);
  const amountInPaise = Math.round(validated.amount * 100);
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  const paymentRecord = {
    id: `pay-${Date.now()}`,
    orderId,
    paymentId: null,
    signature: null,
    amount: amountInPaise,
    currency: 'INR',
    purpose: validated.purpose,
    applicationId: validated.applicationId || null,
    status: 'CREATED',
    customerName: validated.customerName,
    customerEmail: validated.customerEmail,
    customerPhone: validated.customerPhone,
    notes: validated.notes || null,
    verifiedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryDb.payments.unshift(paymentRecord);

  recordAuditLog({
    action: 'CREATE',
    entity: 'Payment',
    entityId: paymentRecord.id,
    details: { orderId, amount: validated.amount, purpose: validated.purpose },
  });

  res.status(201).json({
    success: true,
    data: {
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: config.razorpay.keyId,
      customer: {
        name: validated.customerName,
        email: validated.customerEmail,
        phone: validated.customerPhone,
      },
    },
  });
}

export function verifyPayment(req: Request, res: Response) {
  const { orderId, paymentId, signature } = verifyPaymentSignatureSchema.parse(req.body);

  const payment = memoryDb.payments.find((p) => p.orderId === orderId);
  if (!payment) {
    return res.status(404).json({
      success: false,
      error: { code: 'ORDER_NOT_FOUND', message: 'Payment order not found' },
    });
  }

  // Calculate HMAC SHA256
  const generatedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  // Allow signature match or test bypass if in test/demo mode
  const isTestMode = config.razorpay.keySecret === 'placeholder_secret_key_change_me' || config.env !== 'production';
  const isSignatureValid = isTestMode || generatedSignature === signature;

  if (!isSignatureValid) {
    payment.status = 'FAILED';
    payment.updatedAt = new Date().toISOString();

    recordAuditLog({
      action: 'UPDATE',
      entity: 'Payment',
      entityId: payment.id,
      details: { status: 'FAILED', reason: 'Invalid signature verification' },
    });

    return res.status(400).json({
      success: false,
      error: { code: 'PAYMENT_VERIFICATION_FAILED', message: 'Invalid payment signature' },
    });
  }

  payment.paymentId = paymentId;
  payment.signature = signature;
  payment.status = 'SUCCESS';
  payment.verifiedAt = new Date().toISOString();
  payment.updatedAt = new Date().toISOString();

  // If linked to an application, advance stage
  if (payment.applicationId) {
    const app = memoryDb.applications.find((a) => a.id === payment.applicationId);
    if (app) {
      app.stage = 5; // Enrollment completed
      app.status = 'ACCEPTED';
    }
  }

  recordAuditLog({
    action: 'STATUS_CHANGE',
    entity: 'Payment',
    entityId: payment.id,
    details: { status: 'SUCCESS', paymentId, orderId },
  });

  res.json({
    success: true,
    message: 'Payment verified and captured successfully',
    data: {
      orderId: payment.orderId,
      paymentId: payment.paymentId,
      status: payment.status,
      amount: payment.amount / 100,
      verifiedAt: payment.verifiedAt,
    },
  });
}

export function handleWebhook(req: Request, res: Response) {
  const webhookSignature = req.headers['x-razorpay-signature'] as string;
  const rawBody = JSON.stringify(req.body);

  if (webhookSignature) {
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== webhookSignature && config.isProduction) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }
  }

  const event = req.body.event;
  const payload = req.body.payload?.payment?.entity;

  if (event === 'payment.captured' && payload?.order_id) {
    const payment = memoryDb.payments.find((p) => p.orderId === payload.order_id);
    if (payment && payment.status !== 'SUCCESS') {
      payment.status = 'SUCCESS';
      payment.paymentId = payload.id;
      payment.verifiedAt = new Date().toISOString();
    }
  }

  res.json({ success: true, received: true });
}

export function listPayments(req: AuthenticatedRequest, res: Response) {
  const { status, search } = req.query;

  let list = [...memoryDb.payments];

  if (status) list = list.filter((p) => p.status === status);
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (p) =>
        p.orderId.toLowerCase().includes(q) ||
        (p.paymentId && p.paymentId.toLowerCase().includes(q)) ||
        p.customerName.toLowerCase().includes(q) ||
        p.customerEmail.toLowerCase().includes(q) ||
        (p.applicationId && p.applicationId.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, data: list });
}
