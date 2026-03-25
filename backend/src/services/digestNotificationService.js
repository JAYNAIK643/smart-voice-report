const cron = require('node-cron');
const supabase = require('../../integrations/supabase/client');
const NotificationTemplateService = require('./notificationTemplateService');
const emailService = require('./emailService');

/**
 * Scheduled Digest Notification Service
 * Compiles and sends periodic notification digests to reduce notification fatigue
 */

class DigestNotificationService {
  constructor() {
    this.cronJobs = new Map();
    this.digestQueue = []; // In-memory queue for processing
  }

  /**
   * Initialize digest service
   */
  async initialize() {
    try {
      // Create digest preferences table if it doesn't exist
      await this.ensureDigestPreferencesTable();
      
      // Schedule daily digests (runs at 9 AM local time)
      this.scheduleDailyDigests();
      
      // Schedule weekly digests (runs every Monday at 9 AM)
      this.scheduleWeeklyDigests();
      
      console.log('✅ Digest notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize digest service:', error);
    }
  }

  /**
   * Schedule daily digest notifications
   */
  scheduleDailyDigests() {
    // Run daily at 9 AM
    const job = cron.schedule('0 9 * * *', async () => {
      console.log('📅 Running daily digest notifications');
      await this.sendScheduledDigests('daily');
    });

    this.cronJobs.set('daily', job);
  }

  /**
   * Schedule weekly digest notifications
   */
  scheduleWeeklyDigests() {
    // Run weekly on Monday at 9 AM
    const job = cron.schedule('0 9 * * 1', async () => {
      console.log('📅 Running weekly digest notifications');
      await this.sendScheduledDigests('weekly');
    });

    this.cronJobs.set('weekly', job);
  }

  /**
   * Send scheduled digests for a specific frequency
   */
  async sendScheduledDigests(frequency) {
    try {
      // Get users with this digest frequency
      const { data: preferences, error } = await supabase
        .from('digest_preferences')
        .select(`
          *,
          user:auth.users (id, email, raw_user_meta_data)
        `)
        .eq('frequency', frequency)
        .eq('is_active', true);

      if (error) throw error;

      if (!preferences || preferences.length === 0) {
        console.log(`📭 No users found for ${frequency} digests`);
        return;
      }

      console.log(`📬 Processing ${preferences.length} ${frequency} digest recipients`);

      // Process each user's digest
      const results = await Promise.allSettled(
        preferences.map(pref => this.processUserDigest(pref))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`📊 Digest results - Successful: ${successful}, Failed: ${failed}`);
    } catch (error) {
      console.error(`❌ Error sending ${frequency} digests:`, error);
    }
  }

  /**
   * Process digest for a single user
   */
  async processUserDigest(preference) {
    try {
      const userId = preference.user_id;
      const userEmail = preference.user?.email;
      const userName = preference.user?.raw_user_meta_data?.name || 'User';

      if (!userEmail) {
        throw new Error('User email not found');
      }

      // Get recent notifications for this user
      const recentNotifications = await this.getUserRecentNotifications(
        userId, 
        preference.frequency
      );

      if (recentNotifications.length === 0) {
        console.log(`📭 No notifications to digest for user ${userId}`);
        return { userId, sent: false, reason: 'No notifications' };
      }

      // Compile digest content
      const digestContent = this.compileDigestContent(recentNotifications, userName);

      // Send digest email
      const result = await this.sendDigestEmail(
        userEmail, 
        userName, 
        digestContent,
        preference.frequency
      );

      if (result.success) {
        // Mark notifications as digested
        await this.markNotificationsAsDigested(
          recentNotifications.map(n => n.id)
        );

        // Update last digest sent timestamp
        await this.updateLastDigestSent(preference.id);

        console.log(`✅ Digest sent to ${userEmail} (${recentNotifications.length} notifications)`);
        return { userId, sent: true, notificationCount: recentNotifications.length };
      } else {
        throw new Error(result.error || 'Failed to send digest');
      }
    } catch (error) {
      console.error(`❌ Failed to process digest for user ${preference.user_id}:`, error);
      throw error;
    }
  }

  /**
   * Get recent notifications for a user based on digest frequency
   */
  async getUserRecentNotifications(userId, frequency) {
    try {
      const timeWindow = frequency === 'daily' ? '24 hours' : '7 days';
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('digested', false) // Only undigested notifications
        .gte('created_at', new Date(Date.now() - this.getTimeInMs(timeWindow)).toISOString())
        .order('created_at', { ascending: false })
        .limit(50); // Limit to prevent overly large digests

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }

  /**
   * Compile digest content from notifications
   */
  compileDigestContent(notifications, userName) {
    const grouped = this.groupNotificationsByType(notifications);
    
    let htmlContent = `
      <h2>Hello ${userName}!</h2>
      <p>Here's your ${notifications.length} notification${notifications.length !== 1 ? 's' : ''} from the past period:</p>
    `;

    // Add section for each notification type
    Object.entries(grouped).forEach(([type, notifs]) => {
      const typeTitle = this.getTypeTitle(type);
      htmlContent += `<h3>${typeTitle} (${notifs.length})</h3>`;
      htmlContent += '<ul>';
      
      notifs.slice(0, 5).forEach(notification => {
        htmlContent += `<li>${notification.message}</li>`;
      });
      
      if (notifs.length > 5) {
        htmlContent += `<li>... and ${notifs.length - 5} more notifications</li>`;
      }
      
      htmlContent += '</ul>';
    });

    // Add footer with link to full notifications
    htmlContent += `
      <hr>
      <p><a href="${process.env.SITE_URL || 'https://your-site.com'}/notifications">View all notifications</a></p>
      <p style="font-size: 12px; color: #666;">
        You can adjust your digest preferences in your account settings.
      </p>
    `;

    return htmlContent;
  }

  /**
   * Group notifications by type for better organization
   */
  groupNotificationsByType(notifications) {
    const grouped = {};
    
    notifications.forEach(notification => {
      const type = notification.type || 'general';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(notification);
    });
    
    return grouped;
  }

  /**
   * Get human-readable title for notification type
   */
  getTypeTitle(type) {
    const titles = {
      'status_update': 'Status Updates',
      'resolution': 'Resolved Issues',
      'registration': 'New Submissions',
      'general': 'General Notifications',
      'warning': 'Warnings',
      'success': 'Success Notifications',
      'error': 'Error Notifications'
    };
    
    return titles[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Send digest email to user
   */
  async sendDigestEmail(email, userName, content, frequency) {
    try {
      const subject = `Your ${frequency} notification digest`;
      
      const template = await NotificationTemplateService.getTemplate(
        'digest_notification', 
        'email'
      );

      let htmlContent;
      if (template) {
        const rendered = NotificationTemplateService.renderTemplate(template, {
          userName,
          content,
          frequency
        });
        htmlContent = rendered.content;
      } else {
        // Fallback to basic template
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
              h2 { color: #333; }
              h3 { color: #555; border-bottom: 1px solid #eee; padding-bottom: 5px; }
              ul { padding-left: 20px; }
              li { margin: 5px 0; }
            </style>
          </head>
          <body>
            ${content}
          </body>
          </html>
        `;
      }

      return await emailService.sendTemplatedEmail(email, subject, htmlContent);
    } catch (error) {
      console.error('Error sending digest email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark notifications as included in digest
   */
  async markNotificationsAsDigested(notificationIds) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ digested: true })
        .in('id', notificationIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notifications as digested:', error);
    }
  }

  /**
   * Update last digest sent timestamp
   */
  async updateLastDigestSent(preferenceId) {
    try {
      const { error } = await supabase
        .from('digest_preferences')
        .update({ 
          last_digest_sent: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', preferenceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating digest timestamp:', error);
    }
  }

  /**
   * Convert time string to milliseconds
   */
  getTimeInMs(timeString) {
    const map = {
      '24 hours': 24 * 60 * 60 * 1000,
      '7 days': 7 * 24 * 60 * 60 * 1000
    };
    return map[timeString] || 24 * 60 * 60 * 1000;
  }

  /**
   * Ensure digest preferences table exists
   */
  async ensureDigestPreferencesTable() {
    try {
      // This would typically be handled by migrations
      // For now, we'll check if the table exists
      const { data, error } = await supabase
        .from('digest_preferences')
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        console.log('⚠️ Digest preferences table not found. Please run the migration.');
      }
    } catch (error) {
      console.error('Error checking digest preferences table:', error);
    }
  }

  /**
   * Set user digest preference
   */
  async setUserDigestPreference(userId, frequency) {
    try {
      const { data, error } = await supabase
        .from('digest_preferences')
        .upsert({
          user_id: userId,
          frequency: frequency,
          is_active: frequency !== 'never',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error setting digest preference:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user digest preference
   */
  async getUserDigestPreference(userId) {
    try {
      const { data, error } = await supabase
        .from('digest_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      
      return data || { 
        frequency: 'daily', 
        is_active: true,
        last_digest_sent: null 
      };
    } catch (error) {
      console.error('Error fetching digest preference:', error);
      return { frequency: 'daily', is_active: true, last_digest_sent: null };
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    this.cronJobs.forEach((job, name) => {
      job.stop();
      console.log(`⏹️ Stopped ${name} digest scheduler`);
    });
    this.cronJobs.clear();
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.cronJobs.size > 0,
      scheduledJobs: Array.from(this.cronJobs.keys()),
      queueSize: this.digestQueue.length
    };
  }
}

module.exports = new DigestNotificationService();