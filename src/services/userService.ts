import { User } from '../types';
import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * USER VALIDATION SCHEMA
 * This schema is used to validate the incoming user data with zod library.
 */
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

/** 
 * USER SERVICE CLASS
 * This is the main service class for user management.
 * 
 * @public @method createUser - Handles the logic for creating a new user.
 * 
 * @private @method getMyUser - Decodes the access token and retrieves the user data from the database.
 * @private @method deleteUser - Handles the logic for deleting a user.
 **/
class UserService {

  /**
   * LOGIN USER METHOD:
   * Authenticates a user by email and password.
   *
   * @param {string} email - The user's email address.
   * @param {string} password - The user's plain-text password.
   * @returns {Promise<User>} - The authenticated user object.
   *
   * @throws {401} - If authentication fails.
   * @throws {500} - On server/database errors.
   **/
  async loginUser(email: string, password: string): Promise<User> {
    try {
      const user = await prisma.users.findUnique({
        where: { email },
      });
      if (!user || !user.password_hash) {
        throw { status: 401, error: 'Invalid email or password' };
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        throw { status: 401, error: 'Invalid email or password' };
      }

      return {
        id: user.id,
        plan_id: user.plan_id,
        name: user.name,
        email: user.email,
        photo_url: user.photo_url ?? undefined,
        password_hash: user.password_hash ?? undefined,
        microsoft_id: user.microsoft_id ?? undefined,
        created_at: user.created_at ?? undefined,
        last_login: user.last_login ?? undefined,
      };
    } catch (error: any) {
      console.error('############DEBUG############ Error in loginUser:', error);
      throw { status: error.status || 500, error: error.error || 'Failed to login user' };
    }
  }

  /**
   * GET MY USER METHOD:
   * Decodes the access token and retrieves the user data from the database.
   *
   * @param {string} token - The JWT access token from the Authorization header.
   * @returns {Promise<User | null>} - The user object if found, or null if not found/invalid token.
   *
   * @throws {401} - If the token is invalid or expired.
   * @throws {500} - On server/database errors.
   **/
  async getMyUser(token: string): Promise<User | null> {
    try {
      const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
      // decoded should contain userId or email
      const userId = decoded.userId;
      if (!userId) {
        throw { status: 401, error: 'Invalid token payload' };
      }
      const dbUser = await prisma.users.findUnique({
        where: { id: userId }, select: {
          id: true,
          plan_id: true,
          name: true,
          email: true,
          photo_url: true,
          password_hash: true,
          microsoft_id: true,
        }
      });

      if (!dbUser) return null;
      
      const user: User = {
        id: dbUser.id,
        plan_id: dbUser.plan_id,
        name: dbUser.name,
        email: dbUser.email ,
        photo_url: dbUser.photo_url ?? undefined,
        password_hash: dbUser.password_hash ?? undefined,
        microsoft_id: dbUser.microsoft_id ?? undefined,
      };

      return user;
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw { status: 401, error: 'Invalid or expired token' };
      }
      console.error('############DEBUG############ Error in getMyUser:', error);
      throw { status: 500, error: error instanceof Error ? error.message : error };
    }
  }

  /**
   * GET USER BY ID SERVICE:
   * Retrieves user data from the database by user ID.
   *
   * @param {string} userId - The user's unique identifier.
   * @returns {Promise<User | null>} - The user object if found, or null.
   **/
  async getMyUserFromId(userId: string): Promise<User | null> {
    const dbUser = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        plan_id: true,
        name: true,
        email: true,
        photo_url: true,
        password_hash: true,
        microsoft_id: true,
        created_at: true,
        last_login: true,
      }
    });
    if (!dbUser) return null;
    return {
      id: dbUser.id,
      plan_id: dbUser.plan_id,
      name: dbUser.name,
      email: dbUser.email,
      photo_url: dbUser.photo_url ?? undefined,
      password_hash: dbUser.password_hash ?? undefined,
      microsoft_id: dbUser.microsoft_id ?? undefined,
      created_at: dbUser.created_at ?? undefined,
      last_login: dbUser.last_login ?? undefined,
    };
  }


  /**
    * CREATE USER METHOD:
    * This method handles the business logic for creating a new user.
    * It validates the incoming data, checks for existing users,
    * hashes the password, and then persists the new user to the database.
    *
    * @param {object} userData - The user data for registration.
    * * @param {string} userData.name - The name of the user.
    * * @param {string} userData.email - The user's email address, which must be unique.
    * * @param {string} userData.password - The user's plain-text password.
    *
    * @returns {Promise<object>} A promise that resolves to the newly created user object from the database.
    *
    * Error Codes:
    * @throws {{status: 400, error: object}} Throws a validation error if the user data does not conform to the registerSchema.
    * @throws {{status: 409, error: string}} Throws a conflict error if a user with the provided email already exists.
    * @throws {{status: 500, error: object}} Throws a generic server error for any other exceptions during the process.
  **/
  async createUser(userData: { name: string; email: string; password: string }) {
    //console.log('############DEBUG############ Entered createUser with:', userData);
    try {
      const validation = registerSchema.safeParse(userData);
      if (!validation.success) {
        //console.error('############DEBUG############ Validation failed:', validation.error.issues);
        throw { status: 400, error: validation.error.issues };
      }
      const { name, email, password } = validation.data;

      const existingUser = await prisma.users.findUnique({
        where: { email: email },
      });
      if (existingUser) {
        //console.error('############DEBUG############ User already exists:', email);
        throw { status: 409, error: 'User with this email already exists.' };
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.users.create({
        data: {
          name: name,
          email: email,
          password_hash: hashedPassword,
          plan_id: '3d599a04-2792-4862-b24a-7eaa35a72af5',
          microsoft_id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        },
      });

      //console.log('############DEBUG############ User created:', newUser);
      return newUser;
    } catch (error) {
      console.error('############DEBUG############ Error in createUser:', error);
      throw { status: 500, error: error instanceof Error ? error.message : error };
    }
  }

  /**
   * DELETE USER METHOD:
   * This method deletes a user from the database by their ID.
   *
   * @param {string} id - The unique identifier of the user to delete.
   * @returns {Promise<boolean>} - Resolves to true if the user was deleted, false if not found.
   *
   * @throws {{status: 500, error: object}} Throws a generic server error for any exceptions during the process.
   **/
  async deleteUser(id: string): Promise<boolean> {
    try {
      const deleted = await prisma.users.delete({
        where: { id },
      });
      return !!deleted;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return false;
      }
      console.error('############DEBUG############ Error in deleteUser:', error);
      throw { status: 500, error: error instanceof Error ? error.message : error };
    }
  }


  /**
   * FIND OR CREATE MICROSOFT USER METHOD:
   * This method handles finding an existing Microsoft user or creating a new one.
   * It first searches by the Microsoft ID as the primary key, then by email if provided.
   * If user doesn't exist, creates a new user using the Microsoft ID as the primary key.
   *
   * @param {object} microsoftData - The Microsoft user data.
   * * @param {string} microsoftData.microsoft_id - The Microsoft user ID from OAuth.
   * * @param {string} microsoftData.name - The user's display name from Microsoft.
   * * @param {string} microsoftData.email - The user's email address from Microsoft.
   *
   * @returns {Promise<User & {isNewUser: boolean}>} A promise that resolves to the user object with isNewUser flag.
   *
   * Error Codes:
   * @throws {{status: 500, error: object}} Throws a generic server error for any exceptions during the process.
   **/
  async findOrCreateMicrosoftUser(microsoftData: { 
    microsoft_id: string; 
    name: string; 
    email: string; 
  }): Promise<User & { isNewUser: boolean }> {
    //console.log('############DEBUG############ Entered findOrCreateMicrosoftUser with:', microsoftData);
    try {
      const { microsoft_id, name, email } = microsoftData;

      // First, try to find user by Microsoft ID as the primary key
      let existingUser = await prisma.users.findUnique({
        where: { id: microsoft_id },
      });

      // If not found by Microsoft ID, try to find by email (in case user registered with email first)
      if (!existingUser && email && email !== `${microsoft_id}@microsoft.oauth`) {
        const emailUser = await prisma.users.findUnique({
          where: { email: email },
        });
        
        if (emailUser) {
          //console.log('############DEBUG############ Found existing user by email, but cannot merge due to different IDs');
          // In this case, we have a conflict: user exists with email but different ID
          // You might want to handle this differently based on your business logic
          // For now, we'll create a new user with the Microsoft ID
        }
      }

      if (existingUser) {
        //console.log('############DEBUG############ Existing Microsoft user found:', existingUser.email);
        
        // Update last_login
        existingUser = await prisma.users.update({
          where: { id: microsoft_id },
          data: { last_login: new Date() }
        });

        const user: User & { isNewUser: boolean } = {
          id: existingUser.id,
          plan_id: existingUser.plan_id,
          name: existingUser.name,
          email: existingUser.email,
          photo_url: existingUser.photo_url ?? undefined,
          password_hash: existingUser.password_hash ?? undefined,
          microsoft_id: existingUser.microsoft_id ?? undefined,
          created_at: existingUser.created_at ?? undefined,
          last_login: existingUser.last_login ?? undefined,
          isNewUser: false
        };
        return user;
      }

      // User doesn't exist, create new user with Microsoft ID as primary key
      //console.log('############DEBUG############ Creating new Microsoft user with ID:', microsoft_id);
      const newUser = await prisma.users.create({
        data: {
          id: microsoft_id, // Use Microsoft ID as the primary key
          name: name,
          email: email ?? null,
          password_hash: null, // No password for OAuth users
          plan_id: '3d599a04-2792-4862-b24a-7eaa35a72af5', // Default plan
          microsoft_id: `microsoft_${microsoft_id}`, // Optional: mark as Microsoft user
          created_at: new Date(),
          last_login: new Date(),
        },
      });

      //console.log('############DEBUG############ New Microsoft user created:', newUser);
      
      const user: User & { isNewUser: boolean } = {
        id: newUser.id,
        plan_id: newUser.plan_id,
        name: newUser.name,
        email: newUser.email,
        photo_url: newUser.photo_url ?? undefined,
        password_hash: newUser.password_hash ?? undefined,
        microsoft_id: newUser.microsoft_id ?? undefined,
        created_at: newUser.created_at ?? undefined,
        last_login: newUser.last_login ?? undefined,
        isNewUser: true
      };
      
      return user;
    } catch (error) {
      console.error('############DEBUG############ Error in findOrCreateMicrosoftUser:', error);
      throw { status: 500, error: error instanceof Error ? error.message : error };
    }
  }


}

export const userService = new UserService();