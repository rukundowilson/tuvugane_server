import express from 'express';
import { testConnection } from '../controllers/testController';

const router = express.Router();

router.get('/ping', testConnection);

export default router; 