const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Signal CLI REST API Service
 * Handles communication with the signal-cli-rest-api container
 */
class SignalService {
  constructor() {
    this.baseUrl = config.signalApiUrl;
    this.senderNumber = config.signalNumber;
    
    // Create axios instance with defaults
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000, // 60 seconds for large attachments
      headers: {
        'Content-Type': 'application/json'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
  }

  /**
   * Send a text message to a user (individual)
   * @param {string} recipient - Phone number in international format (e.g., +1234567890)
   * @param {string} message - Text message to send
   * @param {string|null} mediaPath - Optional path to media file
   */
  async sendToUser(recipient, message, mediaPath = null) {
    if (!this.senderNumber) {
      throw new Error('SIGNAL_NUMBER not configured');
    }

    logger.debug('Sending to user', { recipient, hasMedia: !!mediaPath });

    try {
      const payload = {
        message: message,
        number: this.senderNumber,
        recipients: [recipient]
      };

      // Add attachment if media provided
      if (mediaPath) {
        payload.base64_attachments = [await this.fileToBase64(mediaPath)];
      }

      const response = await this.client.post('/v2/send', payload);
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'sendToUser', recipient);
    }
  }

  /**
   * Send a text message to a group
   * @param {string} groupId - The group ID (with or without group. prefix)
   * @param {string} message - Text message to send
   * @param {string|null} mediaPath - Optional path to media file
   */
  async sendToGroup(groupId, message, mediaPath = null) {
    if (!this.senderNumber) {
      throw new Error('SIGNAL_NUMBER not configured');
    }

    // Ensure group ID has the correct format (group. prefix)
    const formattedGroupId = groupId.startsWith('group.') ? groupId : `group.${groupId}`;

    logger.debug('Sending to group', { groupId: formattedGroupId, hasMedia: !!mediaPath });

    try {
      const payload = {
        message: message,
        number: this.senderNumber,
        recipients: [formattedGroupId]
      };

      // Add attachment if media provided
      if (mediaPath) {
        payload.base64_attachments = [await this.fileToBase64(mediaPath)];
      }

      const response = await this.client.post('/v2/send', payload);
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'sendToGroup', formattedGroupId);
    }
  }

  /**
   * Convert a file to base64 string for attachment
   * @param {string} filePath - Path to the file
   * @returns {string} Base64 encoded file with data URI prefix
   */
  async fileToBase64(filePath) {
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Media file not found: ${filePath}`);
    }

    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');

    // Determine MIME type from extension
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.wav': 'audio/wav',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    logger.debug('File converted to base64', { 
      filePath, 
      mimeType, 
      sizeKB: Math.round(fileBuffer.length / 1024) 
    });

    // Return with data URI prefix (Signal API accepts both with and without)
    return `data:${mimeType};base64,${base64Data}`;
  }

  /**
   * Get list of groups the registered number is part of
   */
  async getGroups() {
    try {
      const response = await this.client.get(`/v1/groups/${encodeURIComponent(this.senderNumber)}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'getGroups');
    }
  }

  /**
   * Check if the Signal API is reachable
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/v1/about');
      return {
        healthy: true,
        version: response.data
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Receive pending messages (should be called periodically in normal/native mode)
   */
  async receive() {
    try {
      const response = await this.client.get(`/v1/receive/${encodeURIComponent(this.senderNumber)}`);
      return response.data || [];
    } catch (error) {
      this.handleApiError(error, 'receive');
    }
  }

  /**
   * Create a new group
   * @param {string} name - Group name
   * @param {string[]} members - Array of phone numbers to add
   */
  async createGroup(name, members) {
    try {
      const response = await this.client.post(`/v1/groups/${encodeURIComponent(this.senderNumber)}`, {
        name,
        members
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'createGroup');
    }
  }

  /**
   * Get list of contacts
   */
  async getContacts() {
    try {
      const response = await this.client.get(`/v1/contacts/${encodeURIComponent(this.senderNumber)}`);
      return response.data || [];
    } catch (error) {
      this.handleApiError(error, 'getContacts');
    }
  }

  /**
   * Get QR code link for linking a new device
   * @param {string} deviceName - Name for the device
   */
  async getQRCodeLink(deviceName = 'signal-api') {
    try {
      // Return the URL that can be used to get the QR code
      return `${this.baseUrl}/v1/qrcodelink?device_name=${encodeURIComponent(deviceName)}`;
    } catch (error) {
      this.handleApiError(error, 'getQRCodeLink');
    }
  }

  /**
   * Handle API errors with better error messages
   */
  handleApiError(error, operation, target = null) {
    let errorMessage = error.message;
    let statusCode = null;

    if (error.response) {
      statusCode = error.response.status;
      const data = error.response.data;
      
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data && data.error) {
        errorMessage = data.error;
      } else if (data && data.message) {
        errorMessage = data.message;
      }

      // Common error mappings
      if (statusCode === 400) {
        errorMessage = `Invalid request: ${errorMessage}`;
      } else if (statusCode === 404) {
        errorMessage = `Not found: ${errorMessage}`;
      } else if (statusCode === 500) {
        errorMessage = `Signal API error: ${errorMessage}`;
      }
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to Signal API. Is signal-cli-rest-api running?';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Signal API request timed out';
    }

    logger.error(`Signal API error in ${operation}`, {
      operation,
      target,
      statusCode,
      error: errorMessage
    });

    throw new Error(errorMessage);
  }
}

// Export singleton instance
module.exports = new SignalService();
