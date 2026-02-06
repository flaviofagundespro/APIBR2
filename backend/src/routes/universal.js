import { Router } from 'express';
import axios from 'axios';

const router = Router();
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5002';

// Facebook Download
router.post('/facebook/download', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                error: 'Missing URL',
                message: 'Please provide a valid Facebook URL'
            });
        }

        console.log(`Forwarding Facebook download request to Python service: ${PYTHON_SERVICE_URL}`);

        const response = await axios.post(`${PYTHON_SERVICE_URL}/facebook/download`, { url });

        res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error('Facebook download error:', error.message);
        handleError(error, res, 'Facebook');
    }
});

// Amazon Download (via Universal)
router.post('/amazon/download', async (req, res) => {
    handleUniversalDownload(req, res, 'Amazon');
});

// Shopee Download (via Universal)
router.post('/shopee/download', async (req, res) => {
    handleUniversalDownload(req, res, 'Shopee');
});

// Generic Universal Download
router.post('/universal/download', async (req, res) => {
    handleUniversalDownload(req, res, 'Universal');
});

async function handleUniversalDownload(req, res, platform) {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                error: 'Missing URL',
                message: `Please provide a valid ${platform} URL`
            });
        }

        console.log(`Forwarding ${platform} download request to Python service: ${PYTHON_SERVICE_URL}`);

        const response = await axios.post(`${PYTHON_SERVICE_URL}/universal/download`, { url });

        res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error(`${platform} download error:`, error.message);
        handleError(error, res, platform);
    }
}

function handleError(error, res, platform) {
    if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
            error: 'Service Unavailable',
            message: 'Download service is not running. Please start the python universal downloader.'
        });
    }

    const status = error.response?.status || 500;
    const details = error.response?.data?.detail || error.message;

    res.status(status).json({
        error: `${platform} download failed`,
        details: details
    });
}

export { router as universalRoutes };
