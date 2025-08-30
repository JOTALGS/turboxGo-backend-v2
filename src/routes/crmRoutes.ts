import { Router, Request, Response } from 'express';
import { crmService } from '../services/crm/crmService';
import { ApiResponse } from '../types';

const router = Router();

function getUserIdFromReq(req: Request): string | null {
  // prefer authenticated user on req.user (if you have auth middleware)
  const userFromReq = (req as any).user?.id;
  if (userFromReq) return String(userFromReq);
  // fallback to header set by frontend (x-user-id) if provided
  const header = req.headers['x-user-id'];
  if (typeof header === 'string') return header;
  if (Array.isArray(header)) return header[0];
  // fallback to body (rare)
  if (req.body && req.body.user_id) return String(req.body.user_id);
  return null;
}

/**
 * GET /api/crm/contacts
 * Retrieve CRM contacts for the current user only.
 */
router.get('/contacts', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: missing user id' });
      return;
    }
    const contacts = await crmService.getContacts(userId);
    res.json({ success: true, data: contacts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch contacts' });
  }
});

/**
 * POST /api/crm/contacts
 * Add a new CRM contact associated to the current user.
 */
router.post('/contacts', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: missing user id' });
      return;
    }
    // force association with current user
    req.body.user_id = userId;
    const contact = await crmService.createContact(req.body);
    res.status(201).json({ success: true, data: contact, message: 'Contact created' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || error.message || 'Failed to create contact' });
  }
});


/**
 * PUT /api/crm/contacts/:id
 * Update a CRM contact.
 * Note: this endpoint updates the contact but does not change ownership.
 */
router.put('/contacts/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const id = String(req.params.id);
    const contact = await crmService.updateContact(id, req.body);
    res.json({ success: true, data: contact, message: 'Contact updated' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to update contact' });
  }
});

/**
 * DELETE /api/crm/contacts/:id
 * Delete a CRM contact (no change: caller must ensure authorization).
 */
router.delete('/contacts/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const id = String(req.params.id);
    await crmService.deleteContact(id);
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to delete contact' });
  }
});


/**
 * GET /api/crm/interactions
 * List interactions for the current user. Optional query param: contact_id to filter.
 */
router.get('/interactions', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: missing user id' });
      return;
    }
    const contact_id = typeof req.query.contact_id === 'string' ? req.query.contact_id : undefined;
    const interactions = await crmService.getInteractions({ contact_id, user_id: userId });
    res.json({ success: true, data: interactions });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to fetch interactions' });
  }
});


/**
 * POST /api/crm/interactions
 * Create a new interaction associated to the current user.
 */
router.post('/interactions', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: missing user id' });
      return;
    }
    req.body.user_id = userId;
    const interaction = await crmService.createInteraction(req.body);
    res.status(201).json({ success: true, data: interaction, message: 'Interaction created' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to create interaction' });
  }
});

/**
 * PUT /api/crm/interactions/:id
 * Update an interaction.
 */
router.put('/interactions/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const id = req.params.id;
    const interaction = await crmService.updateInteraction(id, req.body);
    res.json({ success: true, data: interaction, message: 'Interaction updated' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to update interaction' });
  }
});

/**
 * DELETE /api/crm/interactions/:id
 * Delete an interaction.
 */
router.delete('/interactions/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const id = req.params.id;
    await crmService.deleteInteraction(id);
    res.json({ success: true, message: 'Interaction deleted' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to delete interaction' });
  }
});

/**
 * GET /api/crm/activities
 * List activities for the current user. Optional query params: contact_id, deal_id, completed.
 */
router.get('/activities', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: missing user id' });
      return;
    }
    const contact_id = typeof req.query.contact_id === 'string' ? req.query.contact_id : undefined;
    const deal_id = typeof req.query.deal_id === 'string' ? req.query.deal_id : undefined;
    const completed = typeof req.query.completed === 'string' ? (req.query.completed === 'true') : undefined;

    const activities = await crmService.getActivities({ user_id: userId, contact_id, deal_id, completed });
    res.json({ success: true, data: activities });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to fetch activities' });
  }
});


/**
 * POST /api/crm/activities
 * Create a new activity associated to the current user.
 */
router.post('/activities', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: missing user id' });
      return;
    }
    req.body.user_id = userId;
    const activity = await crmService.createActivity(req.body);
    res.status(201).json({ success: true, data: activity, message: 'Activity created' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to create activity' });
  }
});

/**
 * PUT /api/crm/activities/:id
 * Update an activity.
 */
router.put('/activities/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const id = req.params.id;
    const activity = await crmService.updateActivity(id, req.body);
    res.json({ success: true, data: activity, message: 'Activity updated' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to update activity' });
  }
});

/**
 * DELETE /api/crm/activities/:id
 * Delete an activity.
 */
router.delete('/activities/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const id = req.params.id;
    await crmService.deleteActivity(id);
    res.json({ success: true, message: 'Activity deleted' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to delete activity' });
  }
});

export { router as crmRoutes };