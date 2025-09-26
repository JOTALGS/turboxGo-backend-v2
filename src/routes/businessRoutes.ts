import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types';
import { businessService } from '../services/businessService';

const router = Router();

/**
 * GET /api/
 * List businesses. Optional query param: user_id to filter by owner.
 *
 * @query {string} user_id - optional user id.
 * @returns {object} - Array of business records.
 * @throws {500} - On server/database errors.
 
router.get('/', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const user_id = typeof req.query.user_id === 'string' ? req.query.user_id : undefined;
    const businesses = await businessService.getBusinesses(user_id);
    res.json({ success: true, data: businesses });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to fetch businesses' });
  }
});
*/


/**
 * GET /api/business/:id
 * Retrieve a business by USER id.
 *
 * @param {string} id - Business id (url param).
 * @returns {object} - The business record.
 * @throws {404} - If not found.
 * @throws {500} - On server/database errors.
 */
router.get('/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const id = req.params.id;
    const business = await businessService.getBusinessById(id);
    if (!business) {
      res.status(404).json({ success: false, error: 'Business not found' });
      return;
    }
    res.json({ success: true, data: business });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to fetch business' });
  }
});

/**
 * POST /api/business
 * Create a new business record.
 *
 * @body {object} - Business payload (user_id, business_name, contact_email, contact_phone, address, logo_url).
 * @returns {object} - Created business record.
 * @throws {400} - If validation fails.
 * @throws {500} - On server/database errors.
 */
router.post('/', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const business = await businessService.createBusiness(req.body);
    res.status(201).json({ success: true, data: business, message: 'Business created' });
  } catch (error: any) {
    console.error('ERROR CREATEING BUSINESS',error);
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to create business' });
  }
});

/**
 * PUT /api/business/:id
 * Update a business record.
 *
 * @param {string} id - Business id (url param).
 * @body {object} - Partial business fields to update.
 * @returns {object} - Updated business record.
 * @throws {400} - If validation fails.
 * @throws {404} - If business not found.
 * @throws {500} - On server/database errors.
 */
router.put('/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const id = req.params.id;
    const business = await businessService.updateBusiness(id, req.body);
    res.json({ success: true, data: business, message: 'Business updated' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to update business' });
  }
});

/**
 * DELETE /api/business/:id
 * Delete a business record.
 *
 * @param {string} id - Business id (url param).
 * @returns {object} - Success message.
 * @throws {404} - If business not found.
 * @throws {500} - On server/database errors.
 */
router.delete('/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const id = req.params.id;
    await businessService.deleteBusiness(id);
    res.json({ success: true, message: 'Business deleted' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to delete business' });
  }
});

export { router as businessRoutes };