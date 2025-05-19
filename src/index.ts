import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import connectDB from './config/db';
import testRoutes from './routes/testRoutes';
import userRoutes from './routes/userRoutes';
import superAdminRoutes from './routes/superAdminRoutes';
import agencyRoutes from './routes/agencyRoutes';
import adminRoutes from './routes/adminRoutes';
import categoryRoutes from './routes/categoryRoutes';
import ticketRoutes from './routes/ticketRoutes';
import { Request, Response, NextFunction } from 'express';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/test', testRoutes);
app.use('/api/users', userRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tickets', ticketRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Tuvugane API' });
});

// Add global error handler at the end
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({ message: 'Internal server error (global handler)' });
});

const startServer = async () => {
  try {
    // Connect to database
    // await connectDB();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 
