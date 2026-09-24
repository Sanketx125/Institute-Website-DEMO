import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createUserSchema } from '@deekshaam/validation';
import { memoryDb } from '../database/client';
import { recordAuditLog } from '../middleware/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { defaultRoles } from '../database/seed-data';

export function listUsers(req: Request, res: Response) {
  const safeUsers = memoryDb.users.map(({ passwordHash, ...u }) => u);
  res.json({ success: true, data: safeUsers });
}

export async function createUser(req: AuthenticatedRequest, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: parsed.error.errors.map((e) => e.message).join('; '),
        details: parsed.error.flatten(),
      },
    });
  }

  const { email, password, name, role } = parsed.data;

  const existing = memoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, error: { code: 'USER_EXISTS', message: 'User with this email already exists' } });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    name,
    role,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  memoryDb.users.push(newUser);

  recordAuditLog({
    action: 'CREATE',
    entity: 'User',
    entityId: newUser.id,
    userId: req.user?.id,
    userEmail: req.user?.email,
    details: { createdEmail: email, role },
  });

  const { passwordHash, ...safe } = newUser;
  res.status(201).json({ success: true, data: safe });
}

export function listRoles(_req: Request, res: Response) {
  res.json({ success: true, data: defaultRoles });
}

export async function resetUserPassword(req: AuthenticatedRequest, res: Response) {
  const parsed = z.object({ password: createUserSchema.shape.password }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join('; ') } });
  const user = memoryDb.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Staff account not found' } });
  user.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  recordAuditLog({ action: 'UPDATE', entity: 'UserPassword', entityId: user.id, userId: req.user?.id, userEmail: req.user?.email, details: { resetFor: user.email } });
  res.json({ success: true, data: { message: 'Password updated. Previous sessions have been signed out.' } });
}
