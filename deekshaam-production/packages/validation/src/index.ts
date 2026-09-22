import { z } from 'zod';

// ----------------------------------------------------
// AUTH VALIDATION
// ----------------------------------------------------
export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ----------------------------------------------------
// ADMISSIONS VALIDATION
// ----------------------------------------------------
export const applicationSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(/^[0-9+\s-]{10,15}$/, 'Valid 10-digit phone number is required'),
  dob: z.string().min(4, 'Date of birth is required'),
  gender: z.string().optional(),
  state: z.string().min(2, 'State / UT is required'),
  city: z.string().min(2, 'City is required'),
  programSlug: z.string().min(2, 'Program preference is required'),
  specialization: z.string().optional(),
  board10: z.string().min(2, 'Class 10 board is required'),
  year10: z.string().regex(/^[0-9]{4}$/, 'Valid 4-digit passing year required'),
  board12: z.string().min(2, 'Class 12 / Diploma board is required'),
  year12: z.string().regex(/^[0-9]{4}$/, 'Valid 4-digit passing year required'),
  stream: z.string().min(2, 'Academic stream is required'),
  percentage: z.string().min(1, 'Aggregate percentage is required'),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const applicationStatusUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'ACCEPTED', 'REJECTED']),
  stage: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
});

// ----------------------------------------------------
// ENQUIRIES & LEADS VALIDATION
// ----------------------------------------------------
export const generalEnquirySchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^[0-9+\s-]{10,15}$/, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  program: z.string().optional(),
  message: z.string().max(1000).optional(),
  sourcePage: z.string().optional(),
});

export type GeneralEnquiryInput = z.infer<typeof generalEnquirySchema>;

export const campusVisitSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^[0-9+\s-]{10,15}$/, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  program: z.string().optional(),
  preferredDate: z.string().min(4, 'Preferred date is required'),
  preferredTime: z.string().min(2, 'Preferred time slot is required'),
  notes: z.string().max(1000).optional(),
});

export type CampusVisitInput = z.infer<typeof campusVisitSchema>;

export const leadStatusUpdateSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'FOLLOW_UP', 'CLOSED']),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

// ----------------------------------------------------
// PAYMENTS VALIDATION
// ----------------------------------------------------
export const createPaymentOrderSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  purpose: z.enum(['APPLICATION_FEE', 'ADMISSION_FEE', 'TUITION_FEE']),
  applicationId: z.string().optional(),
  customerName: z.string().min(2, 'Name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().min(10, 'Valid phone number is required'),
  notes: z.string().optional(),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;

export const verifyPaymentSignatureSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
  signature: z.string().min(1, 'Signature is required'),
});

export type VerifyPaymentSignatureInput = z.infer<typeof verifyPaymentSignatureSchema>;

// ----------------------------------------------------
// CMS VALIDATION
// ----------------------------------------------------
export const siteSettingsSchema = z.object({
  instituteName: z.string().min(2),
  shortName: z.string().min(1),
  managedBy: z.string().min(2),
  founded: z.string().min(4),
  phone: z.string().min(6),
  admissionEmail: z.string().email(),
  contactEmail: z.string().email(),
  address: z.string().min(5),
  coordinates: z.string().min(3),
  affiliations: z.array(z.string()).default([]),
  heroImage: z.string().url(),
  campusImage: z.string().url(),
  logoImage: z.string().url(),
  socialLinks: z.record(z.string()).optional(),
  seoDefaults: z.record(z.string()).optional(),
});

export const programUpsertSchema = z.object({
  slug: z.string().min(2),
  code: z.string().min(2),
  title: z.string().min(3),
  kicker: z.string().default(''),
  duration: z.string().default('3 years'),
  mode: z.string().default('Classroom learning'),
  eligibility: z.string().min(5),
  image: z.string().default(''),
  summary: z.string().min(10),
  specializations: z.array(z.string()).default([]),
  careers: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  curriculum: z.array(z.array(z.string())).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
});

export const newsUpsertSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(3),
  category: z.string().default('Notice'),
  date: z.string().min(4),
  coverImage: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().min(5),
  href: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
});

export const eventUpsertSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(3),
  date: z.string().min(4),
  time: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().min(5),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
});

export const galleryItemSchema = z.object({
  title: z.string().min(2),
  category: z.string().min(2),
  imageUrl: z.string().min(3),
  caption: z.string().optional(),
  order: z.number().int().default(0),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
});
