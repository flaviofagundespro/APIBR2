import { logger } from "../config/logger.js";
import { triggerN8nWorkflow } from "../services/n8n_integration.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Move up from src/controllers to backend/ to root APIBR2/
const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const DOWNLOADS_DIR = path.join(PROJECT_ROOT, 'integrations/downloads');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'integrations/generated_images');

// Ensure directories exist
if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

export const createProject = async (req, res, next) => {
  try {
    // Placeholder implementation to create a studio project
    res.status(200).json({ message: "Project created." });
  } catch (error) {
    logger.error("Error creating project:", error);
    next(error);
  }
};

export const generateContent = async (req, res, next) => {
  try {
    // Placeholder implementation to orchestrate studio content
    const { contentType, data } = req.body;
    // Example of how to trigger an n8n workflow with job metadata
    await triggerN8nWorkflow("APIBR Studio", { contentType, data });
    res.status(200).json({ message: "Content generation initiated and N8n workflow triggered." });
  } catch (error) {
    logger.error("Error generating content:", error);
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    // List downloads
    const downloads = fs.readdirSync(DOWNLOADS_DIR).map(file => {
      const stats = fs.statSync(path.join(DOWNLOADS_DIR, file));
      const isVideo = file.endsWith('.mp4') || file.endsWith('.mov') || file.endsWith('.avi');
      let thumbnail = null;

      // Try to find a thumbnail for videos
      if (isVideo) {
        const baseName = path.parse(file).name;
        // Check standard thumbnail formats
        const potentialThumbs = [
          `${baseName}.jpg`,
          `${baseName}.png`,
          `${baseName}.webp`,
          `${baseName}-thumb.jpg`
        ];

        for (const thumbName of potentialThumbs) {
          if (fs.existsSync(path.join(DOWNLOADS_DIR, thumbName))) {
            thumbnail = thumbName;
            break;
          }
        }
      }

      return {
        name: file,
        path: path.join('integrations/downloads', file),
        created_at: stats.birthtime,
        size: stats.size,
        type: 'download',
        thumbnail: thumbnail
      };
    }).sort((a, b) => b.created_at - a.created_at);

    // List images
    const images = fs.readdirSync(IMAGES_DIR).map(file => {
      const stats = fs.statSync(path.join(IMAGES_DIR, file));
      return {
        name: file,
        path: path.join('integrations/generated_images', file),
        created_at: stats.birthtime,
        size: stats.size,
        type: 'image'
      };
    }).sort((a, b) => b.created_at - a.created_at);

    res.status(200).json({
      projects: [],
      downloads,
      images
    });
  } catch (error) {
    logger.error("Error getting projects:", error);
    next(error);
  }
};

// Serve static files (optional helpers)
export const getFile = async (req, res, next) => {
  try {
    const { type, filename } = req.params;
    let filepath;
    if (type === 'download') {
      filepath = path.join(DOWNLOADS_DIR, filename);
    } else if (type === 'image') {
      filepath = path.join(IMAGES_DIR, filename);
    } else {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Security check: ensure path is still within intended dir to prevent traversal
    const intendedDir = type === 'download' ? DOWNLOADS_DIR : IMAGES_DIR;
    if (!filepath.startsWith(intendedDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (fs.existsSync(filepath)) {
      logger.info(`Serving file (download): ${filepath}`);
      res.download(filepath, filename || path.basename(filepath), (err) => {
        if (err) {
          logger.error('Error sending file:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Error downloading file' });
          }
        }
      });
    } else {
      logger.warning(`File not found: ${filepath}`);
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    logger.error('Error serving file:', error);
    next(error);
  }
};



