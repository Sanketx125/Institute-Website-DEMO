import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

// Ensure upload directories exist
fs.mkdirSync(config.storage.publicMedia, { recursive: true });
fs.mkdirSync(config.storage.privateDocuments, { recursive: true });

// Storage engine for Public Media (Images, banners, public PDFs)
const publicStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.storage.publicMedia);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
  },
});

// Storage engine for Private Documents (Applicant Marksheets, ID proofs)
const privateStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.storage.privateDocuments);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `doc_${safeBase}_${uniqueSuffix}${ext}`);
  },
});

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file format (${file.mimetype}). Only PDF, DOCX, and JPG/PNG/WEBP images are allowed.`));
  }
};

export const uploadPublicMedia = multer({
  storage: publicStorage,
  limits: { fileSize: config.storage.maxFileSizeMB * 1024 * 1024 },
  fileFilter,
});

export const uploadPrivateDocument = multer({
  storage: privateStorage,
  limits: { fileSize: config.storage.maxFileSizeMB * 1024 * 1024 },
  fileFilter,
});
