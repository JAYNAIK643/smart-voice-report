const supabase = require('../../integrations/supabase/client');
const NotificationTemplateService = require('./notificationTemplateService');
const EnhancedNotificationManager = require('./enhancedNotificationManager');

/**
 * Emergency Broadcast Notification Service
 * Rapid communication system for critical system-wide announcements
 */

class EmergencyBroadcastService {
  constructor() {
    this.broadcastQueue = [];
    this.activeBroadcasts = new Map();
  }

  /**
   * Send emergency broadcast to all users or specific segments
   * @param {Object} broadcastData - Broadcast configuration
   * @param {string} broadcastData.title - Broadcast title
   * @param {string} broadcastData.message - Main message content
   * @param {string} broadcastData.severity - Severity level (critical, high, medium, low)
   * @param {Array} broadcastData.targetRoles - Specific user roles to target (optional)
   * @param {Array} broadcastData.targetWards - Specific wards to target (optional)
   * @param {Array} broadcastData.excludeUsers - User IDs to exclude (optional)
   * @param {Array} broadcastData.channels - Channels to use ['email', 'sms', 'push', 'in_app']
   * @param {boolean} broadcastData.bypassPreferences - Override user preferences
   * @returns {Promise<Object>} Broadcast result
   */
  async sendEmergencyBroadcast(broadcastData) {
    try {
      // Validate input
      const validation = this.validateBroadcastData(broadcastData);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Create broadcast record
      const broadcastId = await this.createBroadcastRecord(broadcastData);
      
      // Get target users
      const targetUsers = await this.getTargetUsers(broadcastData);
      
      if (targetUsers.length === 0) {
        return { success: false, error: 'No target users found' };
      }

      console.log(`📢 Starting emergency broadcast to ${targetUsers.length} users`);

      // Process broadcast in batches to avoid overwhelming systems
      const batchSize = 100;
      const batches = this.createBatches(targetUsers, batchSize);
      
      const results = [];
      for (let i = 0; i < batches.length; i++) {
        console.log(`📤 Processing batch ${i + 1}/${batches.length} (${batches[i].length} users)`);
        const batchResult = await this.sendBatchBroadcast(batches[i], broadcastData, broadcastId);
        results.push(...batchResult);
        
        // Add small delay between batches to prevent rate limiting
        if (i < batches.length - 1) {
          await this.delay(1000); // 1 second delay
        }
      }

      // Update broadcast status
      await this.updateBroadcastStatus(broadcastId, {
        status: 'completed',
        total_recipients: targetUsers.length,
        successful_deliveries: results.filter(r => r.success).length,
        failed_deliveries: results.filter(r => !r.success).length
      });

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      console.log(`✅ Emergency broadcast completed - Success: ${successCount}, Failed: ${failureCount}`);

      return {
        success: true,
        broadcastId,
        totalRecipients: targetUsers.length,
        successfulDeliveries: successCount,
        failedDeliveries: failureCount,
        results
      };
    } catch (error) {
      console.error('❌ Emergency broadcast failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate broadcast data
   */
  validateBroadcastData(data) {
    const errors = [];
    
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    }
    
    if (!data.message || data.message.trim().length === 0) {
      errors.push('Message is required');
    }
    
    if (data.title && data.title.length > 200) {
      errors.push('Title must be 200 characters or less');
    }
    
    if (data.message && data.message.length > 1000) {
      errors.push('Message must be 1000 characters or less');
    }
    
    const validSeverities = ['critical', 'high', 'medium', 'low'];
    if (data.severity && !validSeverities.includes(data.severity)) {
      errors.push('Invalid severity level');
    }
    
    const validChannels = ['email', 'sms', 'push', 'in_app'];
    if (data.channels) {
      const invalidChannels = data.channels.filter(c => !validChannels.includes(c));
      if (invalidChannels.length > 0) {
        errors.push(`Invalid channels: ${invalidChannels.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create broadcast record in database
   */
  async createBroadcastRecord(data) {
    try {
      const { data: broadcast, error } = await supabase
        .from('emergency_broadcasts')
        .insert([{
          title: data.title,
          message: data.message,
          severity: data.severity || 'high',
          target_roles: data.targetRoles || [],
          target_wards: data.targetWards || [],
          exclude_users: data.excludeUsers || [],
          channels: data.channels || ['email', 'sms'],
          bypass_preferences: data.bypassPreferences || false,
          status: 'processing',
          created_by: data.createdBy || 'system',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return broadcast.id;
    } catch (error) {
      console.error('Error creating broadcast record:', error);
      throw error;
    }
  }

  /**
   * Get target users based on broadcast criteria
   */
  async getTargetUsers(broadcastData) {
    try {
      let query = supabase
        .from('profiles')
        .select('id, email, phone, notification_preferences, ward, role');

      // Filter by roles if specified
      if (broadcastData.targetRoles && broadcastData.targetRoles.length > 0) {
        query = query.in('role', broadcastData.targetRoles);
      }

      // Filter by wards if specified
      if (broadcastData.targetWards && broadcastData.targetWards.length > 0) {
        query = query.in('ward', broadcastData.targetWards);
      }

      // Exclude specific users
      if (broadcastData.excludeUsers && broadcastData.excludeUsers.length > 0) {
        query = query.not('id', 'in', `(${broadcastData.excludeUsers.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Filter based on notification preferences if not bypassing
      if (!broadcastData.bypassPreferences) {
        return data.filter(user => {
          const prefs = user.notification_preferences || {};
          return prefs.emergency_enabled !== false;
        });
      }

      return data || [];
    } catch (error) {
      console.error('Error getting target users:', error);
      return [];
    }
  }

  /**
   * Send broadcast to a batch of users
   */
  async sendBatchBroadcast(users, broadcastData, broadcastId) {
    const promises = users.map(user => 
      this.sendToUser(user, broadcastData, broadcastId)
    );

    return await Promise.allSettled(promises);
  }

  /**
   * Send emergency notification to individual user
   */
  async sendToUser(user, broadcastData, broadcastId) {
    try {
      // Prepare notification data
      const notificationData = {
        title: broadcastData.title,
        message: broadcastData.message,
        severity: broadcastData.severity,
        broadcastId
      };

      // Prepare options
      const options = {
        priority: 'critical',
        bypassPreferences: broadcastData.bypassPreferences,
        channels: broadcastData.channels,
        broadcast: true
      };

      // Send notification
      const results = await EnhancedNotificationManager.notify(
        user, 
        'emergency_broadcast', 
        notificationData, 
        options
      );

      // Record delivery attempt
      await this.recordDeliveryAttempt(broadcastId, user.id, results);

      return {
        userId: user.id,
        success: results.some(r => r.promise && typeof r.promise.then === 'function'),
        channels: results.map(r => r.channel)
      };
    } catch (error) {
      console.error(`Failed to send broadcast to user ${user.id}:`, error);
      return {
        userId: user.id,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Record delivery attempt for analytics
   */
  async recordDeliveryAttempt(broadcastId, userId, results) {
    try {
      const deliveryRecords = results.map(result => ({
        broadcast_id: broadcastId,
        user_id: userId,
        channel: result.channel,
        status: result.error ? 'failed' : 'pending',
        failure_reason: result.error,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('broadcast_deliveries')
        .insert(deliveryRecords);

      if (error) throw error;
    } catch (error) {
      console.error('Error recording delivery attempt:', error);
    }
  }

  /**
   * Update broadcast status
   */
  async updateBroadcastStatus(broadcastId, updates) {
    try {
      const { error } = await supabase
        .from('emergency_broadcasts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', broadcastId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating broadcast status:', error);
    }
  }

  /**
   * Create batches from user array
   */
  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get broadcast history
   */
  async getBroadcastHistory(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('emergency_broadcasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching broadcast history:', error);
      return [];
    }
  }

  /**
   * Get broadcast details with delivery statistics
   */
  async getBroadcastDetails(broadcastId) {
    try {
      const { data: broadcast, error: broadcastError } = await supabase
        .from('emergency_broadcasts')
        .select('*')
        .eq('id', broadcastId)
        .single();

      if (broadcastError) throw broadcastError;

      const { data: deliveries, error: deliveryError } = await supabase
        .from('broadcast_deliveries')
        .select('channel, status, COUNT(*) as count')
        .eq('broadcast_id', broadcastId)
        .group('channel, status');

      if (deliveryError) throw deliveryError;

      return {
        broadcast,
        deliveryStats: this.aggregateDeliveryStats(deliveries)
      };
    } catch (error) {
      console.error('Error fetching broadcast details:', error);
      return null;
    }
  }

  /**
   * Aggregate delivery statistics
   */
  aggregateDeliveryStats(deliveries) {
    const stats = {
      byChannel: {},
      overall: { total: 0, successful: 0, failed: 0 }
    };

    deliveries.forEach(delivery => {
      if (!stats.byChannel[delivery.channel]) {
        stats.byChannel[delivery.channel] = { total: 0, successful: 0, failed: 0 };
      }
      
      const count = parseInt(delivery.count);
      stats.byChannel[delivery.channel].total += count;
      stats.overall.total += count;
      
      if (delivery.status === 'delivered') {
        stats.byChannel[delivery.channel].successful += count;
        stats.overall.successful += count;
      } else if (delivery.status === 'failed') {
        stats.byChannel[delivery.channel].failed += count;
        stats.overall.failed += count;
      }
    });

    return stats;
  }

  /**
   * Cancel active broadcast
   */
  async cancelBroadcast(broadcastId) {
    try {
      const { error } = await supabase
        .from('emergency_broadcasts')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', broadcastId);

      if (error) throw error;

      console.log(`🛑 Broadcast ${broadcastId} cancelled`);
      return { success: true };
    } catch (error) {
      console.error('Error cancelling broadcast:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmergencyBroadcastService();