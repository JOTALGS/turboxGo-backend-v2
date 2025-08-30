import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * VALIDATION SCHEMA
 * Validate the objects sent from the client with the desired schema
 */
const contentSchema = z.object({
  name: z.string(),
  logo_url: z.string(),
  banner_url: z.string(),
  title: z.string(),
  tagline: z.string(),
  about: z.any(),
  showHero: z.any(),
  showServices: z.any(),
  showAbout: z.any(),
  showGallery: z.any(),
});

const contactSchema = z.object({
  email: z.string().email(),
  phone: z.union([z.string(), z.number()]),
  address: z.string(),
  social_media_links: z.any(),
});

const stylesSchema = z.object({
  primary_color: z.string(),
  secondary_color: z.union([z.string(), z.number()]),
  text_primary_color: z.string(),
  text_secondary_color: z.string(),
  background_color: z.string(),
  hover_color: z.string(),
  fontFamily: z.string(),
});

export class BuilderService {
  /**
   * CREATE WEBSITE SERVICE
   * Create a new website record for a business.
   *
   * @param {object} data - Payload containing business_id, website_url and subdomain.
   * @param {string} data.business_id - ID of the business that owns the website.
   * @param {string} data.website_url - Public URL of the website.
   * @param {string} data.subdomain - Subdomain assigned to the website.
   * @returns {Promise<any>} The created website record.
   * @throws {Error} On database errors.
   */
  async createWebsite(data: { business_id: string; website_url: string; subdomain: string }) {
    return prisma.websites.create({
      data: {
        business_id: data.business_id,
        website_url: data.website_url,
        subdomain: data.subdomain,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }


  /**
   * UPDATE WEBSITE SERVICE
   * Update fields for an existing website.
   *
   * @param {string} id - Website id (unique identifier).
   * @param {Partial<object>} data - Partial payload with fields to update (business_id, website_url, subdomain).
   * @returns {Promise<any>} The updated website record.
   * @throws {Error} If website not found or on database errors.
   */
  async updateWebsite(id: string, data: Partial<{ business_id: string; website_url: string; subdomain: string }>) {
    return prisma.websites.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }


  /**
   * DELETE WEBSITE SERVICE
   * Delete a website by id.
   *
   * @param {string} id - Website id to delete.
   * @returns {Promise<boolean>} True when deletion succeeds.
   * @throws {Error} If website not found or on database errors.
   */
  async deleteWebsite(id: string) {
    await prisma.websites.delete({ where: { id } });
    return true;
  }

  
  /**
   * CREATE WEBSITE STYLES SERVICE
   * Validate and create a new websiteStyles entry.
   *
   * @param {object} data - Payload containing website_id, content, contact and styles.
   * @param {string} data.website_id - Related website id.
   * @param {any} data.content - Structured content for the site (validated by contentSchema).
   * @param {any} data.contact - Contact info object (validated by contactSchema).
   * @param {any} data.styles - Style configuration (validated by stylesSchema).
   * @returns {Promise<any>} The created websiteStyles record.
   * @throws {400} If validation fails.
   * @throws {Error} On database errors.
   */
  async createWebsiteStyles(data: { website_id: string; content: any; contact: any; styles: any }) {
    const contentValidation = contentSchema.safeParse(data.content);
    if (!contentValidation.success) {
      throw { status: 400, error: contentValidation.error.issues };
    }
    const contactValidation = contactSchema.safeParse(data.contact);
    if (!contactValidation.success) {
      throw { status: 400, error: contactValidation.error.issues };
    }
    const stylesValidation = stylesSchema.safeParse(data.styles);
    if (!stylesValidation.success) {
      throw { status: 400, error: stylesValidation.error.issues };
    }

    return prisma.websiteStyles.create({
      data: {
        website_id: data.website_id,
        content: JSON.stringify(data.content),
        contact: JSON.stringify(data.contact),
        styles: JSON.stringify(data.styles),
      },
    });
  }


  /**
   * UPDATE WEBSITE STYLES SERVICE
   * Validate and update an existing websiteStyles record.
   *
   * @param {string} id - websiteStyles id.
   * @param {Partial<object>} data - Partial update (content, contact, styles).
   * @returns {Promise<any>} The updated websiteStyles record.
   * @throws {400} If validation fails for provided fields.
   * @throws {Error} If record not found or on database errors.
   */
  async updateWebsiteStyles(id: string, data: Partial<{ content: any; contact: any; styles: any }>) {
    // Optionally validate if updating content/contact/styles
    if (data.content) {
      const contentValidation = contentSchema.partial().safeParse(data.content);
      if (!contentValidation.success) {
        throw { status: 400, error: contentValidation.error.issues };
      }
    }
    if (data.contact) {
      const contactValidation = contactSchema.partial().safeParse(data.contact);
      if (!contactValidation.success) {
        throw { status: 400, error: contactValidation.error.issues };
      }
    }
    if (data.styles) {
      const stylesValidation = stylesSchema.partial().safeParse(data.styles);
      if (!stylesValidation.success) {
        throw { status: 400, error: stylesValidation.error.issues };
      }
    }

    const updateData: any = {};
    
    if (data.content) {
      updateData.content = JSON.stringify(data.content);
    }
    if (data.contact) {
      updateData.contact = JSON.stringify(data.contact);
    }
    if (data.styles) {
      updateData.styles = JSON.stringify(data.styles);
    }

    return prisma.websiteStyles.update({
      where: { id },
      data: updateData,
    });
  }


  /**
   * DELETE WEBSITE STYLES SERVICE
   * Delete a websiteStyles record by id.
   *
   * @param {string} id - websiteStyles id to delete.
   * @returns {Promise<boolean>} True when deletion succeeds.
   * @throws {Error} If record not found or on database errors.
   */
  async deleteWebsiteStyles(id: string) {
    await prisma.websiteStyles.delete({ where: { id } });
    return true;
  }

  
  /**
   * GET WEBSITE BY ID SERVICE
   * Returns a single website by its id.
   *
   * @param {string} id - website id
   * @returns {Promise<any | null>} Website record or null if not found.
   * @throws {Error} On database errors.
   */
  async getWebsiteById(id: string) {
    return prisma.websites.findFirst({ where: { business_id: id } });
  }

  
  /**
   * GET WEBSITE STYLES BY WEBSITE ID SERVICE
   * Returns all styles entries for a given website_id.
   *
   * @param {string} websiteId - website id
   * @returns {Promise<any[]>} Array of websiteStyles records.
   * @throws {Error} On database errors.
   */
  async getWebsiteStylesByWebsiteId(websiteId: string) {
    return prisma.websiteStyles.findMany({ where: { website_id: websiteId } });
  }
}

export const builderService = new BuilderService();