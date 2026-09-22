import { Request, Response } from 'express';
import { memoryDb } from '../database/client';

export function search(req: Request, res: Response) {
  const query = String(req.query.q || '').trim().toLowerCase();

  if (!query) {
    return res.json({ success: true, data: [] });
  }

  const results = memoryDb.searchIndex
    .filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchContent = item.content.toLowerCase().includes(query);
      return matchTitle || matchContent;
    })
    .slice(0, 10);

  res.json({ success: true, data: results });
}
