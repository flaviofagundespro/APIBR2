import { Router } from 'express';
import axios from 'axios';

const router = Router();
const PYTHON_INSTAGRAM_URL = process.env.PYTHON_INSTAGRAM_URL || 'http://localhost:5002';

import { promises as fs } from 'fs';

router.post('/download', async (req, res) => {
    try {
        const { url, returnBase64 } = req.body;

        // Coerce to boolean just in case it comes as string "true"
        const shouldReturnBase64 = returnBase64 === true || returnBase64 === 'true';

        console.log('📝 Instagram Request:', { url, rawReturnBase64: returnBase64, coerced: shouldReturnBase64 });

        if (!url) {
            return res.status(400).json({
                error: 'Missing URL',
                message: 'Please provide a valid Instagram URL in the request body'
            });
        }

        console.log(`Forwarding download request to Python service: ${PYTHON_INSTAGRAM_URL}`);

        const response = await axios.post(`${PYTHON_INSTAGRAM_URL}/download`, { url });
        let responseData = response.data;

        console.log('📦 Python Response Type:', Array.isArray(responseData) ? 'Array' : typeof responseData);

        // n8n Support: Return Base64 if requested
        if (shouldReturnBase64) {
            console.log('🔄 Processing Base64 conversion for n8n...');

            // Normalize to array for uniform processing
            const isArray = Array.isArray(responseData);
            const items = isArray ? responseData : [responseData];

            const enrichedItems = await Promise.all(items.map(async (item) => {
                if (item.status === 'success' && item.path) {
                    try {
                        const fileBuffer = await fs.readFile(item.path);
                        const base64 = fileBuffer.toString('base64');
                        return {
                            ...item,
                            base64_content: base64,
                            mime_type: 'video/mp4'
                        };
                    } catch (readErr) {
                        console.error(`Failed to read file for base64: ${item.path}`, readErr);
                        return item;
                    }
                }
                return item;
            }));

            // Return in the same structure as received (Array or Object)
            responseData = isArray ? enrichedItems : enrichedItems[0];
        }

        res.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('Instagram download error:', error.message);

        // Tratamento de erro detalhado
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'Instagram download service is not running. Please start instagram_server.py'
            });
        }

        const status = error.response?.status || 500;
        const details = error.response?.data?.detail || error.message;

        res.status(status).json({
            error: 'Download failed',
            details: details
        });
    }
});

export { router as instagramRoutes };
