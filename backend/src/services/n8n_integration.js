import { logger } from "../config/logger.js";
import { config } from "../config/index.js";

/**
 * n8n integration service responsible for triggering automation workflows.
 */
class N8nIntegrationService {
  constructor() {
    this.n8nBaseUrl = config.n8n?.baseUrl || process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.n8nApiKey = config.n8n?.apiKey || process.env.N8N_API_KEY;
    this.webhookUrl = config.n8n?.webhookUrl || process.env.N8N_WEBHOOK_URL;
  }

  /**
   * Trigger any n8n workflow via webhook.
   * @param {string} workflowName - Workflow name (for logging/observability)
   * @param {Object} data - Payload forwarded to n8n
   * @returns {Promise<Object>} - n8n response payload
   */
  async triggerWorkflow(workflowName, data = {}) {
    try {
      logger.info(`Triggering N8n workflow: ${workflowName}`, { data });

      if (!this.webhookUrl) {
        logger.warn('N8n webhook URL not configured, skipping workflow trigger');
        return { success: false, message: 'N8n webhook not configured' };
      }

      const payload = {
        workflow: workflowName,
        timestamp: new Date().toISOString(),
        data: data,
        source: 'APIBR2'
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-APIBR2-Signature': this.generateSignature(payload)
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`N8n webhook failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      logger.info(`N8n workflow triggered successfully: ${workflowName}`, { result });
      
      return {
        success: true,
        workflow: workflowName,
        result: result
      };

    } catch (error) {
      logger.error(`Error triggering N8n workflow ${workflowName}:`, error);
      return {
        success: false,
        error: error.message,
        workflow: workflowName
      };
    }
  }

  /**
   * Trigger media-studio-specific workflow with standard metadata.
   */
  async triggerStudioWorkflow(workflowName, data = {}) {
    const studioData = {
      ...data,
      studio: 'APIBR2',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString()
    };

    return this.triggerWorkflow(workflowName, studioData);
  }

  /**
   * Trigger audio generation workflow.
   */
  async triggerAudioWorkflow(audioData) {
    return this.triggerStudioWorkflow('audio-generation', {
      type: 'audio',
      ...audioData
    });
  }

  /**
   * Trigger image generation workflow.
   */
  async triggerImageWorkflow(imageData) {
    return this.triggerStudioWorkflow('image-generation', {
      type: 'image',
      ...imageData
    });
  }

  /**
   * Trigger video generation workflow.
   */
  async triggerVideoWorkflow(videoData) {
    return this.triggerStudioWorkflow('video-generation', {
      type: 'video',
      ...videoData
    });
  }

  /**
   * Trigger orchestration workflow for end-to-end projects.
   */
  async triggerProjectWorkflow(projectData) {
    return this.triggerStudioWorkflow('project-processing', {
      type: 'project',
      ...projectData
    });
  }

  /**
   * Generate HMAC signature to authenticate requests with n8n.
   */
  generateSignature(payload) {
    if (!this.n8nApiKey) {
      return '';
    }

    const crypto = require('crypto');
    const data = JSON.stringify(payload);
    return crypto.createHmac('sha256', this.n8nApiKey).update(data).digest('hex');
  }

  /**
   * Return whether the integration has enough configuration to run.
   */
  isConfigured() {
    return !!(this.webhookUrl || this.n8nBaseUrl);
  }

  /**
   * Fetch current n8n health status via the native API.
   */
  async getStatus() {
    try {
      if (!this.n8nBaseUrl) {
        return { connected: false, message: 'N8n base URL not configured' };
      }

      const response = await fetch(`${this.n8nBaseUrl}/api/v1/health`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.n8nApiKey || ''
        }
      });

      if (response.ok) {
        const health = await response.json();
        return {
          connected: true,
          status: health.status || 'unknown',
          version: health.version,
          uptime: health.uptime
        };
      } else {
        return {
          connected: false,
          status: response.status,
          message: 'N8n health check failed'
        };
      }

    } catch (error) {
      logger.error('Error checking N8n status:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

// Singleton instance reused across the app
const n8nService = new N8nIntegrationService();

// Convenience exports for other modules
export const triggerN8nWorkflow = (workflowName, data) => n8nService.triggerWorkflow(workflowName, data);
export const triggerStudioWorkflow = (workflowName, data) => n8nService.triggerStudioWorkflow(workflowName, data);
export const triggerAudioWorkflow = (audioData) => n8nService.triggerAudioWorkflow(audioData);
export const triggerImageWorkflow = (imageData) => n8nService.triggerImageWorkflow(imageData);
export const triggerVideoWorkflow = (videoData) => n8nService.triggerVideoWorkflow(videoData);
export const triggerProjectWorkflow = (projectData) => n8nService.triggerProjectWorkflow(projectData);
export const getN8nStatus = () => n8nService.getStatus();
export const isN8nConfigured = () => n8nService.isConfigured();

export default n8nService; 