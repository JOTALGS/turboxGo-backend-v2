import { Router } from 'express';
import type { Request, Response } from 'express';

// Create a new router instance
const router = Router();

// POST /api/sites
router.post('/sites', (req: Request, res: Response) => {
  const newSiteData = req.body;
  console.log('Creating a new site:', newSiteData);
  res.status(201).json({ message: 'Site created successfully' });
});

// GET /api/sites/:siteId
// TODO: Using a parameter (:siteId) instead static ID (123)
{/*
router.get('/sites/:siteId', (req: Request, res: Response) => {
  const { siteId } = req.params; // Correctly get the parameter from the URL
  console.log(`Fetching data for site: ${siteId}`);
*/} 
router.get('/api/sites/123', (req: Request, res: Response) => {
  const { templateId } = req.params;
  console.log(`Fetching data for site: ${templateId}`);

  const siteData = {
    businessInfo: { 
      name: "Test",
      title: "test",
      tagline: "test",
      about: {
        title: "",
        description: "test",
        subSection1Title: "test",
        subSection1Description: "test",
        subSection2Title: "test",
        subSection2Description: "test"
      },
      logo: null,
      banner: null,
      showHero: {
        show: true,
        variant: "default"
      },
      showAbout: {
        show: true,
        variant: "default"
      },
      showGallery: {
        show: false,
        images: []
      }
    },
    businessStyle: { primaryColor: "#0072B5",
      secondaryColor: "#FFFFFF",
      backgroundColor: "#F0F0F0",
      textPrimaryColor: "#333333",
      textSecondaryColor: "#666666",
      hoverColor: "#FFC107",
      fontFamily: "Arial" 
    },
    contactInfo: { email: "",
      phone: "",
      address: "",
      city: "",
      socialMedia: {
        facebook: "",
        instagram: "",
        twitter: "" },
    services: [ {
      id: 1,
      name: "test",
      description: "test",
      price: "test"
  } ],
    gallery: { show: true, images: [ /* array of images */ ] }
  }};
  
  res.json(siteData);
});

// Export the router to be used in server.ts
export { router as siteRoutes };