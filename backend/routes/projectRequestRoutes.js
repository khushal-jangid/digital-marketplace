import express from 'express';
import { submitProjectRequest } from '../controllers/projectRequestController.js';

const router = express.Router();

router.post('/', submitProjectRequest);

export default router;
