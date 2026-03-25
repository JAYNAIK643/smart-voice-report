/**
 * Mobile Experience Enhancement - Offline Service
 * Handles offline complaint drafting and auto-sync
 * FEATURE FLAG: Can be disabled via ENABLE_PWA_OFFLINE
 */

const OFFLINE_COMPLAINTS_KEY = 'smartcity_offline_complaints';
const OFFLINE_DRAFTS_KEY = 'smartcity_offline_drafts';

/**
 * Check if offline features are enabled
 */
export const isOfflineEnabled = () => {
  // Feature flag check
  const enablePWA = import.meta.env.VITE_ENABLE_PWA_OFFLINE !== 'false';
  return enablePWA && 'indexedDB' in window;
};

/**
 * Check if user is online
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Save complaint draft to local storage
 * @param {Object} complaintData - Complaint form data
 * @returns {Promise<Object>} Result with success status
 */
export const saveDraftOffline = async (complaintData) => {
  if (!isOfflineEnabled()) {
    return { success: false, message: 'Offline mode disabled' };
  }

  try {
    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const draft = {
      id: draftId,
      data: complaintData,
      createdAt: new Date().toISOString(),
      status: 'draft',
    };

    // Get existing drafts
    const existingDrafts = JSON.parse(localStorage.getItem(OFFLINE_DRAFTS_KEY) || '[]');
    
    // Add new draft
    existingDrafts.push(draft);
    
    // Save to localStorage
    localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(existingDrafts));

    console.log('📝 Draft saved offline:', draftId);
    return { success: true, draftId, message: 'Draft saved offline' };
  } catch (error) {
    console.error('❌ Failed to save draft offline:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all offline drafts
 * @returns {Promise<Array>} List of offline drafts
 */
export const getOfflineDrafts = async () => {
  if (!isOfflineEnabled()) {
    return [];
  }

  try {
    const drafts = JSON.parse(localStorage.getItem(OFFLINE_DRAFTS_KEY) || '[]');
    return drafts;
  } catch (error) {
    console.error('❌ Failed to get offline drafts:', error);
    return [];
  }
};

/**
 * Delete an offline draft
 * @param {String} draftId - Draft ID to delete
 * @returns {Promise<Object>} Result with success status
 */
export const deleteOfflineDraft = async (draftId) => {
  if (!isOfflineEnabled()) {
    return { success: false, message: 'Offline mode disabled' };
  }

  try {
    const drafts = JSON.parse(localStorage.getItem(OFFLINE_DRAFTS_KEY) || '[]');
    const filteredDrafts = drafts.filter(draft => draft.id !== draftId);
    localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(filteredDrafts));
    
    console.log('🗑️ Draft deleted:', draftId);
    return { success: true, message: 'Draft deleted' };
  } catch (error) {
    console.error('❌ Failed to delete draft:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Queue complaint for submission when online
 * @param {Object} complaintData - Complaint form data
 * @returns {Promise<Object>} Result with success status
 */
export const queueComplaintForSync = async (complaintData) => {
  if (!isOfflineEnabled()) {
    return { success: false, message: 'Offline mode disabled' };
  }

  try {
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queueItem = {
      id: queueId,
      data: complaintData,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    // Get existing queue
    const existingQueue = JSON.parse(localStorage.getItem(OFFLINE_COMPLAINTS_KEY) || '[]');
    
    // Add new item
    existingQueue.push(queueItem);
    
    // Save to localStorage
    localStorage.setItem(OFFLINE_COMPLAINTS_KEY, JSON.stringify(existingQueue));

    console.log('📤 Complaint queued for sync:', queueId);
    
    // Try to sync immediately if online
    if (isOnline()) {
      setTimeout(() => syncOfflineComplaints(), 1000);
    }

    return { success: true, queueId, message: 'Complaint queued for submission' };
  } catch (error) {
    console.error('❌ Failed to queue complaint:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all queued complaints
 * @returns {Promise<Array>} List of queued complaints
 */
export const getQueuedComplaints = async () => {
  if (!isOfflineEnabled()) {
    return [];
  }

  try {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_COMPLAINTS_KEY) || '[]');
    return queue;
  } catch (error) {
    console.error('❌ Failed to get queued complaints:', error);
    return [];
  }
};

/**
 * Sync all offline complaints to server
 * @returns {Promise<Object>} Sync results
 */
export const syncOfflineComplaints = async () => {
  if (!isOfflineEnabled() || !isOnline()) {
    return { success: false, message: 'Sync not possible' };
  }

  try {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_COMPLAINTS_KEY) || '[]');
    
    if (queue.length === 0) {
      return { success: true, synced: 0, message: 'No complaints to sync' };
    }

    console.log(`🔄 Syncing ${queue.length} offline complaints...`);

    const results = [];
    const token = localStorage.getItem('authToken');

    for (const item of queue) {
      try {
        const response = await fetch('http://localhost:3000/api/grievances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(item.data),
        });

        const result = await response.json();

        if (response.ok) {
          results.push({ id: item.id, success: true, complaintId: result.complaintId });
          console.log('✅ Synced complaint:', item.id);
        } else {
          // Increment retry count
          item.retryCount = (item.retryCount || 0) + 1;
          
          if (item.retryCount >= 3) {
            results.push({ id: item.id, success: false, error: 'Max retries reached' });
            console.error('❌ Complaint sync failed after 3 retries:', item.id);
          } else {
            results.push({ id: item.id, success: false, error: result.message, retry: true });
            console.warn('⚠️ Complaint sync failed, will retry:', item.id);
          }
        }
      } catch (error) {
        console.error('❌ Sync error for complaint:', item.id, error);
        results.push({ id: item.id, success: false, error: error.message });
      }
    }

    // Remove successfully synced complaints and failed ones (max retries)
    const remainingQueue = queue.filter(item => {
      const result = results.find(r => r.id === item.id);
      return result && !result.success && result.retry;
    });

    // Update retry counts
    remainingQueue.forEach(item => {
      const result = results.find(r => r.id === item.id);
      if (result && !result.success) {
        item.retryCount = (item.retryCount || 0) + 1;
      }
    });

    localStorage.setItem(OFFLINE_COMPLAINTS_KEY, JSON.stringify(remainingQueue));

    const syncedCount = results.filter(r => r.success).length;
    console.log(`✅ Sync complete: ${syncedCount}/${queue.length} complaints synced`);

    return {
      success: true,
      synced: syncedCount,
      failed: results.filter(r => !r.success).length,
      results,
    };
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear all offline data (use with caution)
 * @returns {Promise<Object>} Result with success status
 */
export const clearOfflineData = async () => {
  try {
    localStorage.removeItem(OFFLINE_COMPLAINTS_KEY);
    localStorage.removeItem(OFFLINE_DRAFTS_KEY);
    console.log('🧹 Offline data cleared');
    return { success: true, message: 'Offline data cleared' };
  } catch (error) {
    console.error('❌ Failed to clear offline data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get offline storage statistics
 * @returns {Promise<Object>} Storage stats
 */
export const getOfflineStats = async () => {
  try {
    const drafts = JSON.parse(localStorage.getItem(OFFLINE_DRAFTS_KEY) || '[]');
    const queue = JSON.parse(localStorage.getItem(OFFLINE_COMPLAINTS_KEY) || '[]');
    
    return {
      draftsCount: drafts.length,
      queuedCount: queue.length,
      totalSize: new Blob([
        JSON.stringify(drafts),
        JSON.stringify(queue)
      ]).size,
    };
  } catch (error) {
    console.error('❌ Failed to get offline stats:', error);
    return { draftsCount: 0, queuedCount: 0, totalSize: 0 };
  }
};

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Connection restored - syncing offline complaints...');
    syncOfflineComplaints().catch(error => {
      console.error('❌ Auto-sync failed:', error);
    });
  });

  window.addEventListener('offline', () => {
    console.log('📡 Connection lost - offline mode activated');
  });
}
