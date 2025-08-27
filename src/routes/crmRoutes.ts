import { Router, Request, Response } from 'express';
import { crmService } from '../services/crm/crmService';
import { ApiResponse } from '../types';

const router = Router();

/**
 * GET /api/crm/contacts
 * Retrieve all CRM contacts.
 */
router.get('/contacts', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const contacts = await crmService.getContacts();
    res.json({ success: true, data: contacts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch contacts' });
  }
});

/**
 * POST /api/crm/contacts
 * Add a new CRM contact.
 */
router.post('/contacts', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const contact = await crmService.createContact(req.body);
    res.status(201).json({ success: true, data: contact, message: 'Contact created' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to create contact' });
  }
});


/**
 * PUT /api/crm/contacts/:id
 * Update a CRM contact.
 *
 * @param {string} id - Contact ID (URL param).
 * @param {object} body - Contact data to update.
 * @returns {object} - The updated contact object.
 * @throws {400} - If validation fails.
 * @throws {404} - If contact not found.
 * @throws {500} - On server/database errors.
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
 * Delete a CRM contact.
 *
 * @param {string} id - Contact ID (URL param).
 * @returns {object} - Success message.
 * @throws {404} - If contact not found.
 * @throws {500} - On server/database errors.
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
 * POST /api/crm/interactions
 * Create a new interaction.
 *
 * @param {object} body - Interaction data (contact_id, user_id, channel, content).
 * @returns {object} - The created interaction object.
 * @throws {400} - If validation fails.
 * @throws {500} - On server/database errors.
 */
router.post('/interactions', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const interaction = await crmService.createInteraction(req.body);
    res.status(201).json({ success: true, data: interaction, message: 'Interaction created' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to create interaction' });
  }
});

/**
 * PUT /api/crm/interactions/:id
 * Update an interaction.
 *
 * @param {string} id - Interaction ID (URL param).
 * @param {object} body - Interaction data to update.
 * @returns {object} - The updated interaction object.
 * @throws {400} - If validation fails.
 * @throws {404} - If interaction not found.
 * @throws {500} - On server/database errors.
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
 *
 * @param {string} id - Interaction ID (URL param).
 * @returns {object} - Success message.
 * @throws {404} - If interaction not found.
 * @throws {500} - On server/database errors.
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
 * POST /api/crm/activities
 * Create a new activity.
 *
 * @param {object} body - Activity data (type, description, due_date, completed, user_id, contact_id, deal_id).
 * @returns {object} - The created activity object.
 * @throws {400} - If validation fails.
 * @throws {500} - On server/database errors.
 */
router.post('/activities', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const activity = await crmService.createActivity(req.body);
    res.status(201).json({ success: true, data: activity, message: 'Activity created' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to create activity' });
  }
});

/**
 * PUT /api/crm/activities/:id
 * Update an activity.
 *
 * @param {string} id - Activity ID (URL param).
 * @param {object} body - Activity data to update.
 * @returns {object} - The updated activity object.
 * @throws {400} - If validation fails.
 * @throws {404} - If activity not found.
 * @throws {500} - On server/database errors.
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
 *
 * @param {string} id - Activity ID (URL param).
 * @returns {object} - Success message.
 * @throws {404} - If activity not found.
 * @throws {500} - On server/database errors.
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