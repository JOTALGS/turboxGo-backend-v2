import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

const businessSchema = z.object({
  user_id: z.string().uuid().optional(),
  business_name: z.string().min(2, 'Business name is required'),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().max(30).optional(),
  address: z.string().max(255).optional(),
  logo_url: z.string().url().optional(),
});

export class BusinessService {
  /**
   * GET BUSINESSES SERVICE
   * Retrieve businesses. Optionally filter by user_id.
   *
   * @param {string | undefined} userId - Optional user id to filter businesses.
   * @returns {Promise<any[]>} - Array of business records.
   * @throws {Error} - On database errors.
   */
  async getBusinesses(userId?: string) {
    const where = userId ? { where: { user_id: userId } } : {};
    // @ts-ignore Prisma typing convenience
    return prisma.businesses.findMany(where);
  }

  /**
   * GET BUSINESS BY ID SERVICE
   * Retrieve a single business by its id.
   *
   * @param {string} id - Business id (uuid).
   * @returns {Promise<any | null>} - Business record or null.
   * @throws {Error} - On database errors.
   */
  async getBusinessById(userId: string) {
    return prisma.businesses.findFirst({ where: { user_id: userId } });
  }

  /**
   * CREATE BUSINESS SERVICE
   * Validate and create a new business record.
   *
   * @param {object} data - Business payload.
   * @returns {Promise<any>} - Created business record.
   * @throws {400} - If validation fails.
   * @throws {Error} - On database errors.
   */
  async createBusiness(data: any) {
    const parsed = businessSchema.safeParse(data);
    if (!parsed.success) {
      throw { status: 400, error: parsed.error.issues };
    }
    const { user_id, business_name, contact_email, contact_phone, address, logo_url } = parsed.data;
    const businessData: any = {
      business_name,
      contact_email: contact_email ?? null,
      contact_phone: contact_phone ?? null,
      address: address ?? null,
      logo_url: logo_url ?? null,
    };

    if (user_id !== undefined) {
      businessData.user_id = user_id;
    }
    return prisma.businesses.create({
      data: businessData,
    });
  }

  /**
   * UPDATE BUSINESS SERVICE
   * Validate and update an existing business record.
   *
   * @param {string} id - Business id (uuid).
   * @param {object} data - Partial business payload to update.
   * @returns {Promise<any>} - Updated business record.
   * @throws {400} - If validation fails.
   * @throws {404} - If business not found.
   * @throws {Error} - On database errors.
   */
  async updateBusiness(id: string, data: any) {
    const parsed = businessSchema.partial().safeParse(data);
    if (!parsed.success) {
      throw { status: 400, error: parsed.error.issues };
    }

    const existing = await prisma.businesses.findUnique({ where: { id } });
    if (!existing) {
      throw { status: 404, error: 'Business not found' };
    }

    return prisma.businesses.update({
      where: { id },
      data: {
        ...parsed.data,
        // optionally update a timestamp if model has one (not specified)
      },
    });
  }

  /**
   * DELETE BUSINESS SERVICE
   * Delete a business record by id.
   *
   * @param {string} id - Business id (uuid).
   * @returns {Promise<boolean>} - True when deletion succeeds.
   * @throws {404} - If business not found.
   * @throws {Error} - On database errors.
   */
  async deleteBusiness(id: string) {
    const existing = await prisma.businesses.findUnique({ where: { id } });
    if (!existing) {
      throw { status: 404, error: 'Business not found' };
    }
    await prisma.businesses.delete({ where: { id } });
    return true;
  }
}

export const businessService = new BusinessService();