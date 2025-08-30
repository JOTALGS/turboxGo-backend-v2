import { PrismaClient } from '@/generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod schemas for contact validation
const contactSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters long.'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters long.'),
  email: z.string().email('Invalid email address.'),
  phone_number: z.string().max(20).optional(),
  company_id: z.string().max(100).optional(),
  job_title: z.string().max(100).optional(),
  user_id: z.string().uuid({ message: 'Invalid user_id format.' }),
});

const interactionSchema = z.object({
  contact_id: z.string().uuid({ message: 'Invalid contact_id format.' }),
  user_id: z.string().uuid({ message: 'Invalid user_id format.' }),
  channel: z.string().min(2, 'Channel is required.'),
  content: z.string().optional(),
});


const activitySchema = z.object({
  type: z.string().min(2, 'Type is required.'),
  description: z.string().optional(),
  due_date: z.string().datetime().optional(),
  completed: z.boolean().optional(),
  user_id: z.string().uuid({ message: 'Invalid user_id format.' }),
  contact_id: z.string().uuid({ message: 'Invalid contact_id format.' }).nullable().optional(),
  deal_id: z.string().uuid({ message: 'Invalid deal_id format.' }).nullable().optional(),
});

export class CrmService {
  /**
   * GET CONTACTS SERVICE:
   * Retrieves contacts from the database. When userId is provided,
   * returns only contacts that belong to that user.
   *
   * @param {string | undefined} userId - optional user id to scope results
   * @returns {Promise<any[]>} - Array of contact objects.
   */
  async getContacts(userId?: string) {
    const whereClause = userId ? { user_id: userId } : undefined;
    return prisma.contacts.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
    });
  }


  /**
   * UPDATE CONTACT SERVICE:
   * Validates and updates a contact in the database.
   *
   * @param {string} id - The contact ID.
   * @param {object} data - The contact data to update.
   * @returns {Promise<any>} - The updated contact object.
   *
   * @throws {400} - If validation fails.
   * @throws {404} - If contact not found.
   * @throws {500} - On server/database errors.
   */
  async updateContact(id: string, data: any) {
    const validation = contactSchema.partial().safeParse(data);
    if (!validation.success) {
      throw { status: 400, error: validation.error.issues };
    }
    const contact = await prisma.contacts.findUnique({ where: { id } });
    if (!contact) {
      throw { status: 404, error: 'Contact not found.' };
    }
    return prisma.contacts.update({
      where: { id },
      data: validation.data,
    });
  }

  /**
   * DELETE CONTACT SERVICE:
   * Deletes a contact from the database.
   *
   * @param {string} id - The contact ID.
   * @returns {Promise<boolean>} - True if deleted.
   *
   * @throws {404} - If contact not found.
   * @throws {500} - On server/database errors.
   */
  async deleteContact(id: string) {
    const contact = await prisma.contacts.findUnique({ where: { id } });
    if (!contact) {
      throw { status: 404, error: 'Contact not found.' };
    }
    await prisma.contacts.delete({ where: { id } });
    return true;
  }


  /**
   * CREATE CONTACT SERVICE:
   * Validates and creates a new contact in the database.
   *
   * @param {object} data - The contact data.
   * @returns {Promise<any>} - The created contact object.
   *
   * @throws {400} - If validation fails.
   * @throws {409} - If email already exists.
   * @throws {500} - On server/database errors.
   */
  async createContact(data: any) {
    const validation = contactSchema.safeParse(data);
    if (!validation.success) {
      throw { status: 400, error: validation.error.issues };
    }
    const { first_name, last_name, email, phone_number, company_id, job_title, user_id } = validation.data;

    // Check for duplicate email
    const existing = await prisma.contacts.findUnique({ where: { email } });
    if (existing) {
      throw { status: 409, error: 'A contact with this email already exists.' };
    }

    return prisma.contacts.create({
      data: {
        first_name,
        last_name,
        email,
        phone_number,
        company_id,
        job_title,
        user_id: user_id ?? null, // <-- ensure user_id is persisted
      },
    });
  }


  /**
   * GET INTERACTIONS SERVICE
   * Retrieve interactions, optionally filtered by contact_id or user_id.
   *
   * @param {{ contact_id?: string, user_id?: string } | undefined} filter - Optional filters.
   * @returns {Promise<any[]>} Array of interaction records ordered by newest first.
   * @throws {Error} On database errors.
   */
  async getInteractions(filter?: { contact_id?: string; user_id?: string }) {
    const where: any = {};
    if (filter?.contact_id) where.contact_id = filter.contact_id;
    if (filter?.user_id) where.user_id = filter.user_id;

    return prisma.interactions.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }


  /**
   * CREATE INTERACTION SERVICE:
   * Validates and creates a new interaction in the database.
   *
   * @param {object} data - The interaction data.
   * @returns {Promise<any>} - The created interaction object.
   * @throws {400} - If validation fails.
   * @throws {500} - On server/database errors.
   */
  async createInteraction(data: any) {
    const validation = interactionSchema.safeParse(data);
    if (!validation.success) {
      throw { status: 400, error: validation.error.issues };
    }
    return prisma.interactions.create({
      data: validation.data,
    });
  }

  /**
   * UPDATE INTERACTION SERVICE:
   * Validates and updates an interaction in the database.
   *
   * @param {string} id - The interaction ID.
   * @param {object} data - The interaction data to update.
   * @returns {Promise<any>} - The updated interaction object.
   * @throws {400} - If validation fails.
   * @throws {404} - If interaction not found.
   * @throws {500} - On server/database errors.
   */
  async updateInteraction(id: string, data: any) {
    const validation = interactionSchema.partial().safeParse(data);
    if (!validation.success) {
      throw { status: 400, error: validation.error.issues };
    }
    const interaction = await prisma.interactions.findUnique({ where: { id } });
    if (!interaction) {
      throw { status: 404, error: 'Interaction not found.' };
    }
    return prisma.interactions.update({
      where: { id },
      data: validation.data,
    });
  }

  /**
   * DELETE INTERACTION SERVICE:
   * Deletes an interaction from the database.
   *
   * @param {string} id - The interaction ID.
   * @returns {Promise<boolean>} - True if deleted.
   * @throws {404} - If interaction not found.
   * @throws {500} - On server/database errors.
   */
  async deleteInteraction(id: string) {
    const interaction = await prisma.interactions.findUnique({ where: { id } });
    if (!interaction) {
      throw { status: 404, error: 'Interaction not found.' };
    }
    await prisma.interactions.delete({ where: { id } });
    return true;
  }


  /**
   * GET ACTIVITIES SERVICE
   * Retrieve activities, optionally filtered by user_id, contact_id, deal_id or completed status.
   *
   * @param {{ user_id?: string, contact_id?: string, deal_id?: string, completed?: boolean } | undefined} filter
   * @returns {Promise<any[]>} Array of activity records ordered by newest first.
   * @throws {Error} On database errors.
   */
  async getActivities(filter?: { user_id?: string; contact_id?: string; deal_id?: string; completed?: boolean }) {
    const where: any = {};
    if (filter?.user_id) where.user_id = filter.user_id;
    if (filter?.contact_id) where.contact_id = filter.contact_id;
    if (filter?.deal_id) where.deal_id = filter.deal_id;
    if (typeof filter?.completed === 'boolean') where.completed = filter.completed;

    return prisma.activities.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }


  /**
   * CREATE ACTIVITY SERVICE:
   * Validates and creates a new activity in the database.
   *
   * @param {object} data - The activity data.
   * @returns {Promise<any>} - The created activity object.
   * @throws {400} - If validation fails.
   * @throws {500} - On server/database errors.
   */
  async createActivity(data: any) {
    const validation = activitySchema.safeParse(data);
    if (!validation.success) {
      throw { status: 400, error: validation.error.issues };
    }
    return prisma.activities.create({
      data: validation.data,
    });
  }

  /**
   * UPDATE ACTIVITY SERVICE:
   * Validates and updates an activity in the database.
   *
   * @param {string} id - The activity ID.
   * @param {object} data - The activity data to update.
   * @returns {Promise<any>} - The updated activity object.
   * @throws {400} - If validation fails.
   * @throws {404} - If activity not found.
   * @throws {500} - On server/database errors.
   */
  async updateActivity(id: string, data: any) {
    const validation = activitySchema.partial().safeParse(data);
    if (!validation.success) {
      throw { status: 400, error: validation.error.issues };
    }
    const activity = await prisma.activities.findUnique({ where: { id } });
    if (!activity) {
      throw { status: 404, error: 'Activity not found.' };
    }
    return prisma.activities.update({
      where: { id },
      data: validation.data,
    });
  }

  /**
   * DELETE ACTIVITY SERVICE:
   * Deletes an activity from the database.
   *
   * @param {string} id - The activity ID.
   * @returns {Promise<boolean>} - True if deleted.
   * @throws {404} - If activity not found.
   * @throws {500} - On server/database errors.
   */
  async deleteActivity(id: string) {
    const activity = await prisma.activities.findUnique({ where: { id } });
    if (!activity) {
      throw { status: 404, error: 'Activity not found.' };
    }
    await prisma.activities.delete({ where: { id } });
    return true;
  }

  
}

export const crmService = new CrmService();