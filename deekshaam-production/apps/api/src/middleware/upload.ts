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

const MIME_TO_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const publicAllowedMimeTypes = Object.keys(MIME_TO_EXTENSIONS);

// Private applicant documents (marksheets, ID proofs) strictly forbid SVGs to eliminate stored XSS vectors
const privateAllowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const publicFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const validExtensions = MIME_TO_EXTENSIONS[file.mimetype];

  if (!publicAllowedMimeTypes.includes(file.mimetype) || !validExtensions || !validExtensions.includes(ext)) {
    return cb(new Error(`Invalid file type or extension mismatch. Declared ${file.mimetype} with extension ${ext}.`));
  }
  cb(null, true);
};

const privateFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const validExtensions = MIME_TO_EXTENSIONS[file.mimetype];

  if (!privateAllowedMimeTypes.includes(file.mimetype) || !validExtensions || !validExtensions.includes(ext)) {
    return cb(new Error(`Unsupported applicant document format. Only PDF, DOCX, and JPG/PNG/WEBP images are allowed.`));
  }
  cb(null, true);
};

export const uploadPublicMedia = multer({
  storage: publicStorage,
  limits: { fileSize: config.storage.maxFileSizeMB * 1024 * 1024 },
  fileFilter: publicFileFilter,
});

export const uploadPrivateDocument = multer({
  storage: privateStorage,
  limits: { fileSize: config.storage.maxFileSizeMB * 1024 * 1024 },
  fileFilter: privateFileFilter,
});
