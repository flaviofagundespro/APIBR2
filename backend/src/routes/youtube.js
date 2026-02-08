import { Router } from 'express';
import youtubeController from '../controllers/youtubeController.js';

const router = Router();

/**
 * @swagger
 * /api/youtube/scrape:
 *   post:
 *     summary: Scrape YouTube channel videos
 *     description: Extract video information from a YouTube channel with optional OCR processing
 *     tags: [YouTube]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channelUrl
 *             properties:
 *               channelUrl:
 *                 type: string
 *                 description: YouTube channel URL
 *                 example: "https://www.youtube.com/@thiagocalimanIA"
 *               sort:
 *                 type: string
 *                 enum: [popular, recent]
 *                 default: popular
 *                 description: Sort order for videos
 *               maxResults:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 10
 *                 description: Maximum number of videos to scrape
 *               enableOCR:
 *                 type: boolean
 *                 default: false
 *                 description: Enable OCR processing of thumbnails
 *     responses:
 *       200:
 *         description: Successfully scraped channel
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                   count:
 *                     type: integer
 *                   channel:
 *                     type: string
 *                   videos:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         videoId:
 *                           type: string
 *                         title:
 *                           type: string
 *                         url:
 *                           type: string
 *                         thumbnail:
 *                           type: string
 *                         views:
 *                           type: integer
 *                         publishedAt:
 *                           type: string
 *                         age:
 *                           type: string
 *                         channel:
 *                           type: string
 *                         ocrText:
 *                           type: string
 *                           nullable: true
 *       400:
 *         description: Bad request - missing required parameters
 *       500:
 *         description: Internal server error
 */
router.post('/scrape', youtubeController.scrapeChannel.bind(youtubeController));

/**
 * @swagger
 * /api/youtube/video:
 *   post:
 *     summary: Get detailed information about a specific YouTube video
 *     description: Extract detailed information from a YouTube video page
 *     tags: [YouTube]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - videoUrl
 *             properties:
 *               videoUrl:
 *                 type: string
 *                 description: YouTube video URL
 *                 example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *     responses:
 *       200:
 *         description: Successfully retrieved video details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 video:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     views:
 *                       type: string
 *                     likes:
 *                       type: string
 *                     channel:
 *                       type: string
 *                     publishedAt:
 *                       type: string
 *       400:
 *         description: Bad request - missing required parameters
 *       500:
 *         description: Internal server error
 */
router.post('/video', youtubeController.getVideoDetails.bind(youtubeController));

/**
 * @swagger
 * /api/youtube/ocr:
 *   post:
 *     summary: Extract text from image using OCR
 *     description: Process an image URL with Tesseract OCR to extract text
 *     tags: [YouTube, OCR]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL of the image to process
 *                 example: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
 *               languages:
 *                 type: string
 *                 default: "por+eng"
 *                 description: OCR languages (Tesseract format)
 *     responses:
 *       200:
 *         description: Successfully extracted text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 text:
 *                   type: string
 *                 confidence:
 *                   type: number
 *       400:
 *         description: Bad request - missing required parameters
 *       500:
 *         description: Internal server error
 */
router.post('/ocr', youtubeController.extractTextFromImage.bind(youtubeController));

export { router as youtubeRoutes }; 