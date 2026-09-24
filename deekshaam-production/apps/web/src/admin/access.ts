export const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Administrator', CONTENT_ADMIN: 'Content editor', ADMISSION_STAFF: 'Admissions team', ENQUIRY_STAFF: 'Enquiries team',
};
export const workspaceModules = [
  { id: 'dashboard', label: 'Overview', icon: 'grid', group: 'Workspace', roles: Object.keys(roleLabels), description: 'Your workspace and quick actions.' },
  { id: 'admissions', label: 'Applications', icon: 'user', group: 'Student services', roles: ['SUPER_ADMIN', 'ADMISSION_STAFF'], description: 'Review applications and update admission stages.' },
  { id: 'leads', label: 'Enquiries & visits', icon: 'message', group: 'Student services', roles: ['SUPER_ADMIN', 'ADMISSION_STAFF', 'ENQUIRY_STAFF'], description: 'Follow up with prospective students and plan visits.' },
  { id: 'payments', label: 'Payments', icon: 'check', group: 'Student services', roles: ['SUPER_ADMIN'], description: 'Review payment records and reconciliation.' },
  { id: 'programs', label: 'Programs', icon: 'briefcase', group: 'Website', roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'], description: 'Manage degree details and academic content.' },
  { id: 'news', label: 'News & articles', icon: 'document', group: 'Website', roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'], description: 'Publish news and stories from campus.' },
  { id: 'stories', label: 'Success stories', icon: 'user', group: 'Website', roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'], description: 'Publish consented student career journeys.' },
  { id: 'events', label: 'Events', icon: 'calendar', group: 'Website', roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'], description: 'Manage the public campus calendar.' },
  { id: 'gallery', label: 'Photo gallery', icon: 'laptop', group: 'Website', roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'], description: 'Curate campus photographs.' },
  { id: 'notices', label: 'Campus notices', icon: 'document', group: 'Website', roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'], description: 'Publish admissions and campus announcements.' },
  { id: 'media', label: 'Media library', icon: 'laptop', group: 'Website', roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'], description: 'Upload images and curate campus videos.' },
  { id: 'settings', label: 'Site settings', icon: 'settings', group: 'Administration', roles: ['SUPER_ADMIN'], description: 'Update institutional identity and contact details.' },
  { id: 'users', label: 'Team & access', icon: 'shield', group: 'Administration', roles: ['SUPER_ADMIN'], description: 'Create staff accounts and assign access.' },
  { id: 'audit', label: 'Activity log', icon: 'clock', group: 'Administration', roles: ['SUPER_ADMIN'], description: 'Review recorded administrative activity.' },
] as const;
export const canAccess = (role: string, module: string) => workspaceModules.some(m => m.id === module && (m.roles as readonly string[]).includes(role));
