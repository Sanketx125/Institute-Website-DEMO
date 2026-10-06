import { Request, Response } from 'express';
import { validatePromoCodeSchema } from '@deekshaam/validation';
import { referralService } from './referral.service';

export function validatePromoCode(req: Request, res: Response) {
  if (!referralService.isEnabled()) {
    return res.status(400).json({
      success: false,
      error: { code: 'FEATURE_DISABLED', message: 'Referral system is currently disabled.' },
    });
  }

  const parsed = validatePromoCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'This code is not valid.',
      },
    });
  }

  const { code } = parsed.data;
  const outcome = referralService.validateCode(code);

  if (!outcome.valid || !outcome.calculation) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PROMO_CODE',
        message: outcome.message || 'This code is not valid.',
      },
    });
  }

  const { calculation } = outcome;

  res.json({
    success: true,
    data: {
      valid: true,
      code: outcome.code,
      discountPercent: calculation.discountPercent,
      discountAmount: calculation.discountAmountPaise / 100, // in INR
      originalFee: calculation.grossFeePaise / 100, // in INR
      finalFee: calculation.netFeePaise / 100, // in INR
      message: outcome.message,
    },
  });
}
