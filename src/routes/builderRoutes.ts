import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types';
import { builderService } from '../services/builder/builderService';

const router = Router();

/**
 * GET /api/builder/websites/:id
 * Retrieve a website by business id.
 */
router.get('/websites/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const id = req.params.id;
    const website = await builderService.getWebsiteById(id);
    if (!website) {
      res.status(404).json({ success: false, error: 'Website not found' });
      return;
    }
    res.json({ success: true, data: website });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to fetch website' });
  }
});

/**
 * POST /api/builder/websites
 * Create a new website entry.
 */
router.post('/websites', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { business_id, website_url, subdomain } = req.body;
    if (!business_id || !website_url || !subdomain) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const website = await builderService.createWebsite({ business_id, website_url, subdomain });
    res.status(201).json({ success: true, data: website, message: 'Website created' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to create website' });
  }
});

/**
 * PUT /api/builder/websites/:id
 * Update a website entry.
 */
router.put('/websites/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const id = req.params.id;
    const website = await builderService.updateWebsite(id, req.body);
    res.json({ success: true, data: website, message: 'Website updated' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to update website' });
  }
});

/**
 * DELETE /api/builder/websites/:id
 * Delete a website entry.
 */
router.delete('/websites/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const id = req.params.id;
    await builderService.deleteWebsite(id);
    res.json({ success: true, message: 'Website deleted' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to delete website' });
  }
});

/**
 * GET /api/builder/website-styles
 * List website styles. Optional query param: website_id to filter.
 */
router.get('/website-styles', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const website_id = typeof req.query.website_id === 'string' ? req.query.website_id : undefined;
    let data;
    if (website_id) {
      data = await builderService.getWebsiteStylesByWebsiteId(website_id);
    } else {
      res.status(400).json({ success: false, error: 'website_id query parameter is required' });
      return;
    }
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to fetch website styles' });
  }
});

/**
 * POST /api/builder/website-styles
 * Create a new website styles entry.
 */
router.post('/website-styles', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { website_id, content, contact, styles } = req.body;
    if (!website_id || !content || !contact || !styles) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const websiteStyles = await builderService.createWebsiteStyles({ website_id, content, contact, styles });
    res.status(201).json({ success: true, data: websiteStyles, message: 'Website styles created' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error || 'Failed to create website styles' });
  }
});


/**
 * PUT /api/builder/website-styles/:id
 * Update a website styles entry.
 */
router.put('/website-styles/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const id = req.params.id;
    const websiteStyles = await builderService.updateWebsiteStyles(id, req.body);
    res.json({ success: true, data: websiteStyles, message: 'Website styles updated' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to update website styles' });
  }
});

/**
 * DELETE /api/builder/website-styles/:id
 * Delete a website styles entry.
 */
router.delete('/website-styles/:id', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const id = req.params.id;
    await builderService.deleteWebsiteStyles(id);
    res.json({ success: true, message: 'Website styles deleted' });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, error: error.error || 'Failed to delete website styles' });
  }
});

export { router as builderRoutes };