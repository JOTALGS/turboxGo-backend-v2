import { Router, Request, Response } from 'express';
import { userService } from '../services/userService';
import { ApiResponse, User } from '../types';
import { sign } from 'jsonwebtoken';

const router = Router();

/**
 * GET /api/users/me
 * Retrieve the authenticated user's data using the access token.
 *
 * Requires: Authorization header with Bearer token.
 *
 * @returns {object} - The user object if authenticated.
 * @throws {401} - If token is missing or invalid.
 * @throws {500} - On server/database errors.
 **/
router.get('/me', async (req: Request, res: Response<ApiResponse<User>>) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access token missing or invalid'
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    const user = await userService.getMyUser(token);
    res.json({
      success: true,
      data: user || undefined,
      message: 'User retrieved successfully'
    });
  } catch (error: Error | any) {
    console.error('Error in /me endpoint:', error);
    res.status(error.status || 500).json({
      success: false,
      error: 'Failed to retrieve user'
    });
  }
});

/**
 * POST /api/users/login
 * Authenticate a user and return access and refresh tokens.
 *
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {object} - The user object plus access and refresh tokens.
 * @throws {401} - If authentication fails.
 * @throws {500} - On server/database errors.
 **/
router.post('/login', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
      return;
    }

    let user;
    try {
      user = await userService.loginUser(email, password);
    } catch (err: any) {
      res.status(err.status || 500).json({
        success: false,
        error: err.error || 'Failed to login user'
      });
      return;
    }

    const accessToken = sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: 'email'
      },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '24h' }
    );

    const refreshToken = sign(
      {
        userId: user.id,
      },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' }
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24,
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: '/',
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan_id: user.plan_id,
        accessToken,
        refreshToken
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to login user'
    });
  }
});


/**
 * POST /api/users/refresh
 * Refresh the user's access token using the refresh token cookie.
 *
 * Requires: refreshToken cookie.
 *
 * @returns {object} - New access token and user data.
 * @throws {401} - If refresh token is missing or invalid.
 * @throws {500} - On server/database errors.
 **/
router.post('/refresh', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, error: 'Refresh token missing' });
      return;
    }

    let decoded;
    try {
      decoded = require('jsonwebtoken').verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!);
    } catch (err) {
      res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
      return;
    }

    const user = await userService.getMyUserFromId(decoded.userId);
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    const accessToken = require('jsonwebtoken').sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: 'email'
      },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '24h' }
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24,
      path: '/',
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to refresh token' });
  }
});


/**
 * POST /api/users/logout
 * Logs out the user by clearing authentication cookies.
 *
 * @returns {object} - Success message.
 * @throws {500} - On server errors.
 **/
router.post('/logout', async (req: Request, res: Response<ApiResponse<null>>) => {
  try {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to logout user'
    });
  }
});


/**
 * POST /api/users/register
 * Register a new user
 * 
 * @param {string} name - The name of the user
 * @param {string} email - The email of the user
 * @param {string} password - The password of the user
 * 
 * @returns {object} - The new user object plus access and refresh tokens
 * 
 * @throws {400} - If the name, email, or password is not provided
 * @throws {409} - If the user already exists
 * @throws {500} - Other errors 
 **/
router.post('/register', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    //console.log('############DEBUG############ Register request received: ', req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
      return;
    }

    let newUser;
    try {
      newUser = await userService.createUser({ name, email, password });
    } catch (err: any) {
      res.status(err.status || 500).json({
        success: false,
        error: err.error || 'Failed to create user in db'
      });
      return;
    }

    console.log('############DEBUG############ New user created:', newUser);

    const accessToken = sign(
      {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        provider: 'email'
      },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '24h' }
    );

    const refreshToken = sign(
      {
        userId: newUser.id,
      },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' }
    );

    console.log('############DEBUG############ Setting cookies:', newUser);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24,
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: '/',
    });

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        plan_id: newUser.plan_id,
        accessToken,
        refreshToken
      },
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user by their unique identifier.
 *
 * @param {string} id - The unique identifier of the user to delete (UUID).
 * @returns {object} - Success message if deleted, 404 if not found, 400 if invalid ID.
 *
 * @throws {400} - If the user ID is not provided or invalid.
 * @throws {404} - If the user does not exist.
 * @throws {500} - On server/database errors.
 **/
router.delete('/:id', async (req: Request, res: Response<ApiResponse<null>>) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string' || id.length < 10) {
      res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
      return;
    }

    const deleted = await userService.deleteUser(id);
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});


/**
 * POST /api/users/microsoft-auth
 * Handle Microsoft OAuth authentication - create or retrieve user
 * 
 * @param {string} microsoft_id - The Microsoft user ID from the session
 * @param {string} name - The user's name from Microsoft profile
 * @param {string} email - The user's email from Microsoft profile (optional)
 * 
 * @returns {object} - The user object plus access and refresh tokens
 * 
 * @throws {400} - If required fields are missing
 * @throws {500} - On server/database errors
 **/
router.post('/microsoft-auth', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    //console.log('############DEBUG############ Microsoft auth request received:', req.body);
    const { microsoft_id, name, email } = req.body;

    if (!microsoft_id || !name) {
      res.status(400).json({
        success: false,
        error: 'Microsoft ID and name are required'
      });
      return;
    }

    let user;
    try {
      // First try to find user by Microsoft ID
      user = await userService.findOrCreateMicrosoftUser({
        microsoft_id,
        name,
        email: email || `${microsoft_id}@microsoft.oauth` // Fallback email if not provided
      });
    } catch (err: any) {
      console.error('############DEBUG############ Error in findOrCreateMicrosoftUser:', err);
      res.status(err.status || 500).json({
        success: false,
        error: err.error || 'Failed to process Microsoft authentication'
      });
      return;
    }

    //console.log('############DEBUG############ Microsoft user processed:', user);

    const accessToken = sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: 'microsoft'
      },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '24h' }
    );

    const refreshToken = sign(
      {
        userId: user.id,
      },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' }
    );

    //console.log('############DEBUG############ Setting cookies for Microsoft user');

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24,
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: '/',
    });

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan_id: user.plan_id,
        accessToken,
        refreshToken
      },
      message: user.isNewUser ? 'User created successfully' : 'User authenticated successfully'
    });
  } catch (error) {
    console.error('############DEBUG############ Error in Microsoft auth endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process Microsoft authentication'
    });
  }
});


export { router as userRoutes };