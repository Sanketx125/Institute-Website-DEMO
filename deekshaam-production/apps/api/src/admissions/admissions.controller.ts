import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { applicationSchema, applicationStatusUpdateSchema } from '@deekshaam/validation';
import { memoryDb } from '../database/client';
import { recordAuditLog } from '../middleware/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { config } from '../config';

function generateApplicationId(): string {
  const year = new Date().getFullYear();
  const randomSixDigit = Math.floor(100000 + Math.random() * 900000);
  return `DBS-${year}-${randomSixDigit}`;
}

export function submitApplication(req: Request, res: Response) {
  const validated = applicationSchema.parse(req.body);
  const applicationId = generateApplicationId();

  const application = {
    id: applicationId,
    ...validated,
    status: 'SUBMITTED',
    stage: 1, // 1: Submitted, 2: Document Verification, 3: Admissions Review, 4: Decision, 5: Enrollment
    documents: [],
    statusHistory: [
      {
        id: `ash-${Date.now()}`,
        applicationId,
        oldStatus: null,
        newStatus: 'SUBMITTED',
        comment: 'Application submitted online by applicant',
        changedBy: 'APPLICANT',
        timestamp: new Date().toISOString(),
      },
    ],
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryDb.applications.unshift(application);

  recordAuditLog({
    action: 'CREATE',
    entity: 'Application',
    entityId: applicationId,
    details: { fullName: application.fullName, programSlug: application.programSlug },
  });

  res.status(201).json({
    success: true,
    data: {
      id: application.id,
      fullName: application.fullName,
      email: application.email,
      programSlug: application.programSlug,
      status: application.status,
      stage: application.stage,
      submittedAt: application.submittedAt,
    },
  });
}

export function trackApplication(req: Request, res: Response) {
  const { id } = req.params;
  const application = memoryDb.applications.find((a) => a.id.toUpperCase() === id.trim().toUpperCase());

  if (!application) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'No application found with this reference ID' },
    });
  }

  const stages = [
    { number: 1, title: 'Application received', description: 'Application submitted successfully' },
    { number: 2, title: 'Document verification', description: 'Verification of 10th & 12th credentials' },
    { number: 3, title: 'Admissions committee review', description: 'Academic evaluation and seat allocation' },
    { number: 4, title: 'Decision & Provisional Offer', description: 'Admission outcome communication' },
    { number: 5, title: 'Enrollment & Registration', description: 'Fee payment and enrollment completion' },
  ];

  res.json({
    success: true,
    data: {
      id: application.id,
      fullName: application.fullName,
      email: application.email,
      programSlug: application.programSlug,
      status: application.status,
      stage: application.stage,
      submittedAt: application.submittedAt,
      stages,
    },
  });
}

export function uploadApplicantDocument(req: Request, res: Response) {
  const { id } = req.params;
  const application = memoryDb.applications.find((a) => a.id.toUpperCase() === id.trim().toUpperCase());

  if (!application) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, error: { code: 'FILE_MISSING', message: 'No file uploaded' } });
  }

  const documentType = req.body.documentType || 'OTHER';

  const doc = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    applicationId: application.id,
    documentType,
    fileName: req.file.originalname,
    filePath: req.file.filename,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    uploadedAt: new Date().toISOString(),
  };

  application.documents.push(doc);
  memoryDb.applicationDocuments.push(doc);

  // Advance stage to document review if in stage 1
  if (application.stage === 1) {
    application.stage = 2;
    application.status = 'UNDER_REVIEW';
  }

  res.status(201).json({
    success: true,
    data: {
      id: doc.id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      uploadedAt: doc.uploadedAt,
    },
  });
}

export function listApplications(req: AuthenticatedRequest, res: Response) {
  const { status, program, search } = req.query;

  let list = [...memoryDb.applications];

  if (status) {
    list = list.filter((a) => a.status === status);
  }
  if (program) {
    list = list.filter((a) => a.programSlug === program);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, data: list });
}

export function getApplicationDetail(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const app = memoryDb.applications.find((a) => a.id === id);
  if (!app) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
  }
  res.json({ success: true, data: app });
}

export function updateApplicationStatus(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const app = memoryDb.applications.find((a) => a.id === id);
  if (!app) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
  }

  const { status, stage, comment } = applicationStatusUpdateSchema.parse(req.body);
  const oldStatus = app.status;

  app.status = status;
  if (stage) app.stage = stage;
  app.updatedAt = new Date().toISOString();

  const historyEntry = {
    id: `ash-${Date.now()}`,
    applicationId: app.id,
    oldStatus,
    newStatus: status,
    comment: comment || `Status updated to ${status}`,
    changedBy: req.user?.email || 'STAFF',
    timestamp: new Date().toISOString(),
  };

  app.statusHistory.push(historyEntry);
  memoryDb.applicationStatusHistory.push(historyEntry);

  recordAuditLog({
    action: 'STATUS_CHANGE',
    entity: 'Application',
    entityId: id,
    userId: req.user?.id,
    userEmail: req.user?.email,
    details: { oldStatus, newStatus: status, comment },
  });

  res.json({ success: true, data: app });
}

export function downloadPrivateDocument(req: AuthenticatedRequest, res: Response) {
  const { docId } = req.params;
  const doc = memoryDb.applicationDocuments.find((d) => d.id === docId);

  if (!doc) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document record not found' } });
  }

  const fullPath = path.join(config.storage.privateDocuments, doc.filePath);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ success: false, error: { code: 'FILE_NOT_FOUND', message: 'File missing from storage' } });
  }

  recordAuditLog({
    action: 'EXPORT',
    entity: 'ApplicationDocument',
    entityId: docId,
    userId: req.user?.id,
    userEmail: req.user?.email,
    details: { documentType: doc.documentType, fileName: doc.fileName },
  });

  res.download(fullPath, doc.fileName);
}
