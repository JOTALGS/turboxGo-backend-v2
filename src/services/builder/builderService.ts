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


  async updateWebsite(id: string, data: Partial<{ business_id: string; website_url: string; subdomain: string }>) {
    return prisma.websites.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  async deleteWebsite(id: string) {
    await prisma.websites.delete({ where: { id } });
    return true;
  }

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
        content: data.content,
        contact: data.contact,
        styles: data.styles,
      },
    });
  }


  async updateWebsiteStyles(id: string, data: Partial<{ content: any; contact: any; styles: any }>) {
    // Optionally validate if updating content/contact/styles
    if (data.content) {
      const contentValidation = contentSchema.safeParse(data.content);
      if (!contentValidation.success) {
        throw { status: 400, error: contentValidation.error.issues };
      }
    }
    if (data.contact) {
      const contactValidation = contactSchema.safeParse(data.contact);
      if (!contactValidation.success) {
        throw { status: 400, error: contactValidation.error.issues };
      }
    }
    if (data.styles) {
      const stylesValidation = stylesSchema.safeParse(data.styles);
      if (!stylesValidation.success) {
        throw { status: 400, error: stylesValidation.error.issues };
      }
    }
    return prisma.websiteStyles.update({
      where: { id },
      data,
    });
  }

  async deleteWebsiteStyles(id: string) {
    await prisma.websiteStyles.delete({ where: { id } });
    return true;
  }

}

export const builderService = new BuilderService();