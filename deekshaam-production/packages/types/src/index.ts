// ===================================================
// DEEKSHAAM PRODUCTION PLATFORM - UNIFIED DOMAIN TYPES
// ===================================================

export enum RoleType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CONTENT_ADMIN = 'CONTENT_ADMIN',
  ADMISSION_STAFF = 'ADMISSION_STAFF',
  ENQUIRY_STAFF = 'ENQUIRY_STAFF',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: RoleType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface SiteSettings {
  id?: string;
  instituteName: string;
  shortName: string;
  managedBy: string;
  founded: string;
  phone: string;
  admissionEmail: string;
  contactEmail: string;
  address: string;
  coordinates: string;
  affiliations: string[];
  heroImage: string;
  campusImage: string;
  logoImage: string;
  socialLinks?: Record<string, string>;
  seoDefaults?: Record<string, string>;
  updatedAt?: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  altText?: string;
  category?: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface Program {
  id: string;
  slug: string;
  code: string;
  title: string;
  kicker: string;
  duration: string;
  mode: string;
  eligibility: string;
  image: string;
  summary: string;
  specializations: string[];
  careers: string[];
  highlights: string[];
  curriculum: string[][]; // 6 semesters
  status: ContentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Certification {
  id: string;
  group: string;
  duration: string;
  title: string;
  text: string;
  status: ContentStatus;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string;
  headName?: string;
}

export interface FacultyMember {
  id: string;
  name: string;
  role: string;
  departmentId?: string;
  image?: string;
  note?: string;
  isLeadership: boolean;
}

export interface PageSection {
  id: string;
  type: 'hero' | 'features' | 'stats' | 'split' | 'cta' | 'faq' | 'cards' | 'text' | 'html';
  title?: string;
  subtitle?: string;
  content?: string;
  metadata?: Record<string, any>;
  order: number;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  metaDescription?: string;
  status: ContentStatus;
  sections: PageSection[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  order: number;
  parentId?: string;
  children?: MenuItem[];
  target?: string;
}

export interface Menu {
  id: string;
  name: string; // e.g., 'primary', 'footer', 'mobile'
  items: MenuItem[];
}

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  coverImage?: string;
  summary?: string;
  content: string;
  href?: string;
  status: ContentStatus;
  createdAt?: string;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  summary: string;
  description?: string;
  coverImage?: string;
  status: ContentStatus;
}

export interface NoticeItem {
  id: string;
  title: string;
  date: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  fileUrl?: string;
  status: ContentStatus;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  caption?: string;
  order: number;
  status: ContentStatus;
}

export interface InstitutionalDocument {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileSize?: string;
  status: ContentStatus;
}

// ===================================================
// ADMISSIONS DOMAIN
// ===================================================

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  DOCUMENT_VERIFICATION = 'DOCUMENT_VERIFICATION',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentType: 'PHOTO' | 'MARKSHEET_10' | 'MARKSHEET_12' | 'ID_PROOF' | 'OTHER';
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface ApplicationStatusHistory {
  id: string;
  applicationId: string;
  oldStatus?: ApplicationStatus;
  newStatus: ApplicationStatus;
  comment?: string;
  changedBy?: string;
  timestamp: string;
}

export interface Application {
  id: string; // e.g. DBS-2026-104928
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  gender?: string;
  state: string;
  city: string;
  programSlug: string;
  specialization?: string;
  board10: string;
  year10: string;
  board12: string;
  year12: string;
  stream: string;
  percentage: string;
  status: ApplicationStatus;
  stage: number; // 1: Submitted, 2: Document Review, 3: Admissions Review, 4: Decision, 5: Enrollment
  documents?: ApplicationDocument[];
  statusHistory?: ApplicationStatusHistory[];
  submittedAt: string;
  updatedAt: string;
}

// ===================================================
// ENQUIRIES & LEADS DOMAIN
// ===================================================

export enum LeadType {
  GENERAL_ENQUIRY = 'GENERAL_ENQUIRY',
  CALLBACK = 'CALLBACK',
  CAMPUS_VISIT = 'CAMPUS_VISIT',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  FOLLOW_UP = 'FOLLOW_UP',
  CLOSED = 'CLOSED',
}

export interface LeadHistory {
  id: string;
  leadId: string;
  oldStatus?: LeadStatus;
  newStatus: LeadStatus;
  notes?: string;
  changedBy?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  type: LeadType;
  name: string;
  email?: string;
  phone: string;
  program?: string;
  preferredDate?: string;
  preferredTime?: string;
  message?: string;
  sourcePage?: string;
  status: LeadStatus;
  assignedTo?: string;
  notes?: string;
  history?: LeadHistory[];
  createdAt: string;
  updatedAt: string;
}

// ===================================================
// PAYMENTS DOMAIN
// ===================================================

export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentPurpose {
  APPLICATION_FEE = 'APPLICATION_FEE',
  ADMISSION_FEE = 'ADMISSION_FEE',
  TUITION_FEE = 'TUITION_FEE',
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  paymentId?: string;
  signature?: string;
  amount: number; // in paise
  currency: string;
  purpose: PaymentPurpose;
  applicationId?: string;
  status: PaymentStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ===================================================
// SEARCH, SEO & ANALYTICS DOMAIN
// ===================================================

export interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'Program' | 'Certification' | 'Page' | 'News' | 'Event' | 'Notice' | 'Facility' | 'Admissions';
  score?: number;
}

export interface AnalyticsEventPayload {
  eventType: 'page_view' | 'cta_click' | 'form_submission' | 'search_query' | 'ai_interaction';
  pagePath: string;
  referrer?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

// ===================================================
// AUDIT LOGS
// ===================================================

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  STATUS_CHANGE = 'STATUS_CHANGE',
  EXPORT = 'EXPORT',
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  details?: Record<string, any>;
  timestamp: string;
}

// ===================================================
// API STANDARD ENVELOPE
// ===================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}
