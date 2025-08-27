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
   * Retrieves all contacts from the database.
   *
   * @returns {Promise<any[]>} - Array of contact objects.
   */
  async getContacts() {
    return prisma.contacts.findMany();
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
    const { first_name, last_name, email, phone_number, company_id, job_title } = validation.data;

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
      },
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