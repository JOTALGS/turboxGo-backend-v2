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
        firebase_uid: user.firebase_uid ?? undefined,
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
          firebase_uid: true,
        }
      });

      if (!dbUser) return null;
      
      const user: User = {
        id: dbUser.id,
        plan_id: dbUser.plan_id,
        name: dbUser.name,
        email: dbUser.email,
        photo_url: dbUser.photo_url ?? undefined,
        password_hash: dbUser.password_hash ?? undefined,
        firebase_uid: dbUser.firebase_uid ?? undefined,
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
        firebase_uid: true,
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
      firebase_uid: dbUser.firebase_uid ?? undefined,
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
          firebase_uid: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
}

export const userService = new UserService();