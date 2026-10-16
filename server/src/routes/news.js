import { Router } from 'express';
import { listNews, getNews } from '../controllers/newsController.js';

const router = Router();
router.get('/', listNews);
router.get('/:slug', getNews);
export default router;
