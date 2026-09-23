import { Request, Response, NextFunction, RequestHandler } from 'express';

// Express 4 does not forward rejected promises from handlers to the error
// middleware, so an async handler that throws would crash the process.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
