import fs from 'fs';
import path from 'path';
import { findProjectRoot } from '../database/client';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type: 'APPLICATION_CONFIRMATION' | 'STATUS_UPDATE' | 'LEAD_ALERT' | 'PAYMENT_RECEIPT';
  metadata?: Record<string, any>;
}

export class EmailService {
  private emailStorageDir: string;

  constructor() {
    const root = findProjectRoot(__dirname);
    this.emailStorageDir = path.resolve(root, 'storage/emails');
    fs.mkdirSync(this.emailStorageDir, { recursive: true });
  }

  public async sendEmail(message: EmailMessage): Promise<{ id: string; delivered: boolean }> {
    const emailId = `mail-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const emailRecord = {
      id: emailId,
      ...message,
      sentAt: new Date().toISOString(),
    };

    // If external email provider API key is set, send over the wire
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Deekshaam Admissions <admissions@deekshaam.edu>',
            to: message.to,
            subject: message.subject,
            html: message.html,
          }),
        });
      } catch (err: any) {
        console.error('[EMAIL ERROR] Upstream API email dispatch failed:', err.message);
      }
    }

    // Always record locally for complete auditability, inspectability, and testing
    try {
      const filePath = path.join(this.emailStorageDir, `${emailId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(emailRecord, null, 2), 'utf8');
      console.log(`[EMAIL DISPATCH] ${message.type} -> ${message.to} (Subject: "${message.subject}")`);
    } catch (err) {
      console.error('[EMAIL ERROR] Failed to record email to disk:', err);
    }

    return { id: emailId, delivered: true };
  }

  public async sendApplicationConfirmation(params: {
    to: string;
    studentName: string;
    applicationId: string;
    programName: string;
    accessToken: string;
  }) {
    const subject = `Application Received: ${params.applicationId} - Deekshaam Business School`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b;">Deekshaam Business School</h2>
        <p>Dear <strong>${params.studentName}</strong>,</p>
        <p>Thank you for submitting your application for the <strong>${params.programName}</strong> program.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">Your Application Reference ID:</p>
          <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: bold; color: #0284c7;">${params.applicationId}</p>
        </div>
        <p>You can track your admissions journey, review documents, and check committee decisions at:</p>
        <p><a href="http://localhost:3000/track" style="color: #0284c7; font-weight: 600;">Track Your Application</a></p>
        <p style="font-size: 13px; color: #94a3b8; margin-top: 30px;">This is an automated notification from Deekshaam Admissions Office.</p>
      </div>
    `;
    return this.sendEmail({
      to: params.to,
      subject,
      html,
      type: 'APPLICATION_CONFIRMATION',
      metadata: { applicationId: params.applicationId },
    });
  }

  public async sendStatusUpdate(params: {
    to: string;
    studentName: string;
    applicationId: string;
    oldStatus: string;
    newStatus: string;
    comment?: string;
  }) {
    const subject = `Update on your Deekshaam Application: ${params.applicationId}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b;">Deekshaam Business School</h2>
        <p>Dear <strong>${params.studentName}</strong>,</p>
        <p>There has been an update regarding your admission application (<strong>${params.applicationId}</strong>).</p>
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px; margin: 16px 0;">
          <p style="margin: 0; font-weight: bold; color: #166534;">New Status: ${params.newStatus}</p>
          ${params.comment ? `<p style="margin: 8px 0 0 0; color: #374151;">${params.comment}</p>` : ''}
        </div>
        <p>Log in to your tracking portal to review any next steps or requirements.</p>
        <p><a href="http://localhost:3000/track" style="color: #0284c7; font-weight: 600;">View Status in Admissions Portal</a></p>
      </div>
    `;
    return this.sendEmail({
      to: params.to,
      subject,
      html,
      type: 'STATUS_UPDATE',
      metadata: { applicationId: params.applicationId, newStatus: params.newStatus },
    });
  }

  public async sendPaymentReceipt(params: {
    to: string;
    studentName: string;
    applicationId: string;
    orderId: string;
    paymentId: string;
    amount: number;
  }) {
    const subject = `Fee Payment Receipt - ${params.applicationId}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b;">Deekshaam Business School</h2>
        <p>Dear <strong>${params.studentName}</strong>,</p>
        <p>Your payment of <strong>₹${params.amount.toFixed(2)}</strong> has been successfully captured and verified via Razorpay.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Application ID:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${params.applicationId}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Razorpay Payment ID:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${params.paymentId}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Order Reference:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${params.orderId}</td></tr>
          <tr><td style="padding: 8px; color: #64748b;">Status:</td><td style="padding: 8px; color: #16a34a; font-weight: bold;">SUCCESS</td></tr>
        </table>
      </div>
    `;
    return this.sendEmail({
      to: params.to,
      subject,
      html,
      type: 'PAYMENT_RECEIPT',
      metadata: { applicationId: params.applicationId, paymentId: params.paymentId },
    });
  }

  public async sendNewLeadAlert(params: {
    counselorEmail: string;
    leadName: string;
    leadPhone: string;
    leadEmail?: string;
    program?: string;
    type: string;
    message?: string;
  }) {
    const subject = `[New Admission Lead] ${params.type}: ${params.leadName} (${params.program || 'General'})`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="color: #0f172a;">New Prospective Student Lead</h3>
        <p><strong>Name:</strong> ${params.leadName}</p>
        <p><strong>Phone:</strong> ${params.leadPhone}</p>
        <p><strong>Email:</strong> ${params.leadEmail || 'Not provided'}</p>
        <p><strong>Program Interest:</strong> ${params.program || 'General'}</p>
        <p><strong>Type:</strong> ${params.type}</p>
        ${params.message ? `<p><strong>Note:</strong> ${params.message}</p>` : ''}
        <p><a href="http://localhost:3000/admin/leads">Open Counselor Lead Workspace</a></p>
      </div>
    `;
    return this.sendEmail({
      to: params.counselorEmail,
      subject,
      html,
      type: 'LEAD_ALERT',
      metadata: { leadPhone: params.leadPhone },
    });
  }
}

export const emailService = new EmailService();
