import { Request, Response, NextFunction } from 'express';
import { ActivityAction, EntityType } from '@business-card-manager/shared';
import { db } from '../db/connection.js';
import { activityLogs } from '../db/schema.js';

export async function logActivity(
  action: ActivityAction,
  entityType?: EntityType,
  entityId?: number,
  metadata?: Record<string, any>
) {
  try {
    await db.insert(activityLogs).values({
      action,
      entityType,
      entityId,
      metadata,
    });
    
    console.log(`[ACTIVITY] ${action} for ${entityType}:${entityId}`);
  } catch (error) {
    console.error('[ACTIVITY ERROR]', error);
    // Don't fail the main operation if activity logging fails
  }
}

export function activityLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}