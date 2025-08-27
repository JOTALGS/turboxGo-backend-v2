import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { apiRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { ApiResponse } from './types';
import cookieParser from 'cookie-parser';


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cookieParser());

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root route
app.get('/', (req, res: express.Response<ApiResponse<{ name: string; version: string }>>) => {
  res.json({
    success: true,
    data: {
      name: 'Express TypeScript API',
      version: '1.0.0'
    },
    message: 'API is running successfully'
  });
});

// API routes
app.use('/api', apiRoutes);

// Error handling
app.use('*', notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});

export default app;