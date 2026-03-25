const NotificationTemplateService = require('./notificationTemplateService');
const emailService = require('./emailService');
const smsService = require('./smsService');

/**
 * Enhanced Notification Manager with Delivery Tracking
 * Orchestrates notifications across channels with robust tracking and retry logic
 */

class EnhancedNotificationManager {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
    this.deliveryLogs = []; // In-memory cache for immediate access
  }

  /**
   * Send notification with full tracking
   * @param {Object} user - User object with preferences
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Array of delivery results
   */
  async notify(user, type, data, options = {}) {
    const notifications = [];
    const deliveryResults = [];

    try {
      // 1. Email Notification with template
      if (this.shouldSendEmail(user, options)) {
        const emailResult = await this.sendEmailNotification(user, type, data, options);
        deliveryResults.push(emailResult);
        notifications.push(emailResult.promise);
      }

      // 2. SMS Notification with template
      if (this.shouldSendSMS(user, options)) {
        const smsResult = await this.sendSMSNotification(user, type, data, options);
        deliveryResults.push(smsResult);
        notifications.push(smsResult.promise);
      }

      // 3. Push Notification
      if (this.shouldSendPush(user, options)) {
        const pushResult = await this.sendPushNotification(user, type, data, options);
        deliveryResults.push(pushResult);
        notifications.push(pushResult.promise);
      }

      // 4. In-App Notification
      if (this.shouldSendInApp(user, options)) {
        const inAppResult = await this.sendInAppNotification(user, type, data, options);
        deliveryResults.push(inAppResult);
        notifications.push(inAppResult.promise);
      }

      // Wait for all notifications (non-blocking)
      if (notifications.length > 0) {
        Promise.allSettled(notifications)
          .then(results => {
            results.forEach((result, index) => {
              const deliveryResult = deliveryResults[index];
              if (result.status === 'fulfilled') {
                this.logSuccessfulDelivery(deliveryResult, result.value);
              } else {
                this.logFailedDelivery(deliveryResult, result.reason);
                this.scheduleRetry(deliveryResult, result.reason);
              }
            });
          })
          .catch(error => {
            console.error('Bulk notification error:', error);
          });
      }

      return deliveryResults;
    } catch (error) {
      console.error('Notification orchestration failed:', error);
      throw error;
    }
  }

  /**
   * Send critical alert with highest priority
   * @param {Object} user - User object
   * @param {Object} alertData - Alert data
   * @returns {Promise<Array>}
   */
  async sendCriticalAlert(user, alertData) {
    const options = {
      priority: 'critical',
      bypassPreferences: true, // Override user preferences for emergencies
      channels: ['email', 'sms'] // Critical alerts go to email and SMS
    };

    return await this.notify(user, 'critical_alert', alertData, options);
  }

  /**
   * Send email notification using templates
   */
  async sendEmailNotification(user, type, data, options) {
    const deliveryId = this.generateDeliveryId();
    
    try {
      // Get template
      const template = await NotificationTemplateService.getTemplate(
        this.getTemplateName(type, 'email'), 
        'email', 
        user.preferredLanguage || 'en'
      );

      if (!template) {
        throw new Error(`No email template found for type: ${type}`);
      }

      // Validate variables
      const validation = NotificationTemplateService.validateVariables(template, data);
      if (!validation.isValid) {
        throw new Error(`Invalid template variables: ${validation.missing.join(', ')}`);
      }

      // Render template
      const rendered = NotificationTemplateService.renderTemplate(template, data);

      // Log delivery attempt
      const deliveryLog = {
        id: deliveryId,
        userId: user._id || user.id,
        channel: 'email',
        type,
        status: 'pending',
        provider: 'resend',
        createdAt: new Date(),
        metadata: { templateId: template.id, ...options }
      };

      this.deliveryLogs.push(deliveryLog);

      // Send email
      const promise = emailService.sendTemplatedEmail(
        user.email,
        rendered.subject,
        rendered.content,
        {
          userId: user._id || user.id,
          type,
          deliveryId
        }
      ).then(result => {
        if (result.success) {
          deliveryLog.status = 'delivered';
          deliveryLog.deliveredAt = new Date();
          deliveryLog.providerResponse = result;
        } else {
          throw new Error(result.error || 'Email delivery failed');
        }
        return result;
      });

      return {
        deliveryId,
        channel: 'email',
        type,
        promise,
        deliveryLog
      };
    } catch (error) {
      return {
        deliveryId,
        channel: 'email',
        type,
        error: error.message,
        promise: Promise.reject(error)
      };
    }
  }

  /**
   * Send SMS notification using templates
   */
  async sendSMSNotification(user, type, data, options) {
    const deliveryId = this.generateDeliveryId();
    
    try {
      // Get template
      const template = await NotificationTemplateService.getTemplate(
        this.getTemplateName(type, 'sms'), 
        'sms', 
        user.preferredLanguage || 'en'
      );

      if (!template) {
        throw new Error(`No SMS template found for type: ${type}`);
      }

      // Validate and render
      const validation = NotificationTemplateService.validateVariables(template, data);
      if (!validation.isValid) {
        throw new Error(`Invalid SMS template variables: ${validation.missing.join(', ')}`);
      }

      const rendered = NotificationTemplateService.renderTemplate(template, data);

      // Log delivery attempt
      const deliveryLog = {
        id: deliveryId,
        userId: user._id || user.id,
        channel: 'sms',
        type,
        status: 'pending',
        provider: 'twilio',
        createdAt: new Date(),
        metadata: { templateId: template.id, ...options }
      };

      this.deliveryLogs.push(deliveryLog);

      // Send SMS
      const promise = smsService.sendSMS({
        to: user.phone,
        message: rendered.content,
        messageType: type,
        userId: user._id || user.id,
        deliveryId
      }).then(result => {
        if (result.success) {
          deliveryLog.status = 'delivered';
          deliveryLog.deliveredAt = new Date();
          deliveryLog.providerResponse = result;
        } else {
          throw new Error(result.error || 'SMS delivery failed');
        }
        return result;
      });

      return {
        deliveryId,
        channel: 'sms',
        type,
        promise,
        deliveryLog
      };
    } catch (error) {
      return {
        deliveryId,
        channel: 'sms',
        type,
        error: error.message,
        promise: Promise.reject(error)
      };
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(user, type, data, options) {
    const deliveryId = this.generateDeliveryId();
    
    // Push notifications are handled client-side, so we just log the intent
    const deliveryLog = {
      id: deliveryId,
      userId: user._id || user.id,
      channel: 'push',
      type,
      status: 'pending',
      provider: 'browser',
      createdAt: new Date(),
      metadata: { ...options }
    };

    this.deliveryLogs.push(deliveryLog);

    const promise = Promise.resolve({
      success: true,
      message: 'Push notification queued for client delivery'
    });

    return {
      deliveryId,
      channel: 'push',
      type,
      promise,
      deliveryLog
    };
  }

  /**
   * Send in-app notification
   */
  async sendInAppNotification(user, type, data, options) {
    const deliveryId = this.generateDeliveryId();
    
    // This would typically integrate with your in-app notification system
    const deliveryLog = {
      id: deliveryId,
      userId: user._id || user.id,
      channel: 'in_app',
      type,
      status: 'pending',
      provider: 'supabase',
      createdAt: new Date(),
      metadata: { ...options }
    };

    this.deliveryLogs.push(deliveryLog);

    const promise = Promise.resolve({
      success: true,
      message: 'In-app notification created'
    });

    return {
      deliveryId,
      channel: 'in_app',
      type,
      promise,
      deliveryLog
    };
  }

  // Helper methods
  shouldSendEmail(user, options) {
    if (options.channels && !options.channels.includes('email')) return false;
    if (options.bypassPreferences) return true;
    return user.emailEnabled !== false && user.email;
  }

  shouldSendSMS(user, options) {
    if (options.channels && !options.channels.includes('sms')) return false;
    if (options.bypassPreferences) return user.phone ? true : false;
    return user.smsEnabled === true && user.phone;
  }

  shouldSendPush(user, options) {
    if (options.channels && !options.channels.includes('push')) return false;
    if (options.bypassPreferences) return false; // Push requires user opt-in
    return user.pushEnabled === true;
  }

  shouldSendInApp(user, options) {
    if (options.channels && !options.channels.includes('in_app')) return false;
    if (options.bypassPreferences) return true;
    return user.inAppEnabled !== false;
  }

  getTemplateName(type, channel) {
    const templateMap = {
      registration: 'complaint_submitted',
      status_update: 'complaint_status_update',
      resolution: 'complaint_resolved',
      critical_alert: 'critical_alert'
    };
    
    const baseName = templateMap[type] || type;
    return channel === 'sms' ? `${baseName}_sms` : 
           channel === 'push' ? `${baseName}_push` : baseName;
  }

  generateDeliveryId() {
    return `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  logSuccessfulDelivery(deliveryResult, response) {
    const log = this.deliveryLogs.find(l => l.id === deliveryResult.deliveryId);
    if (log) {
      log.status = 'delivered';
      log.deliveredAt = new Date();
      log.providerResponse = response;
      log.retryCount = log.retryCount || 0;
    }
    console.log(`✅ ${deliveryResult.channel.toUpperCase()} delivery successful:`, deliveryResult.deliveryId);
  }

  logFailedDelivery(deliveryResult, error) {
    const log = this.deliveryLogs.find(l => l.id === deliveryResult.deliveryId);
    if (log) {
      log.status = 'failed';
      log.failureReason = error.message;
      log.retryCount = (log.retryCount || 0) + 1;
    }
    console.error(`❌ ${deliveryResult.channel.toUpperCase()} delivery failed:`, error.message);
  }

  scheduleRetry(deliveryResult, error) {
    const log = this.deliveryLogs.find(l => l.id === deliveryResult.deliveryId);
    if (log && log.retryCount < this.maxRetries) {
      const delay = this.retryDelay * Math.pow(2, log.retryCount); // Exponential backoff
      console.log(`🔄 Scheduling retry ${log.retryCount + 1}/${this.maxRetries} in ${delay}ms`);
      
      setTimeout(() => {
        this.retryDelivery(deliveryResult);
      }, delay);
    } else {
      console.error(`💥 Max retries exceeded for delivery:`, deliveryResult.deliveryId);
    }
  }

  async retryDelivery(deliveryResult) {
    console.log(`🔁 Retrying delivery:`, deliveryResult.deliveryId);
    // Retry logic would re-execute the specific notification type
    // This is a simplified version - in practice, you'd recreate the notification
  }

  /**
   * Get delivery status for a specific delivery
   */
  getDeliveryStatus(deliveryId) {
    return this.deliveryLogs.find(log => log.id === deliveryId);
  }

  /**
   * Get all deliveries for a user
   */
  getUserDeliveries(userId) {
    return this.deliveryLogs.filter(log => log.userId === userId);
  }

  /**
   * Get delivery statistics
   */
  getDeliveryStats() {
    const stats = {
      total: this.deliveryLogs.length,
      pending: 0,
      delivered: 0,
      failed: 0,
      byChannel: {}
    };

    this.deliveryLogs.forEach(log => {
      stats[log.status] = (stats[log.status] || 0) + 1;
      stats.byChannel[log.channel] = (stats.byChannel[log.channel] || 0) + 1;
    });

    return stats;
  }
}

module.exports = new EnhancedNotificationManager();