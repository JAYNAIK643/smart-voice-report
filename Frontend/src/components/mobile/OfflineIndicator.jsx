/**
 * Mobile Experience Enhancement - Offline Indicator Component
 * Shows visual feedback when user is offline
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, CloudOff } from 'lucide-react';
import { isOnline, getOfflineStats, syncOfflineComplaints } from '@/services/offlineService';

const OfflineIndicator = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState({ queuedCount: 0, draftsCount: 0 });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setOnline(navigator.onLine);
      updateStats();
    };

    const updateStats = async () => {
      const offlineStats = await getOfflineStats();
      setStats(offlineStats);
    };

    // Initial stats
    updateStats();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Update stats periodically
    const interval = setInterval(updateStats, 5000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (online && stats.queuedCount > 0 && !syncing) {
      setSyncing(true);
      syncOfflineComplaints()
        .then(() => {
          updateStats();
        })
        .finally(() => {
          setSyncing(false);
        });
    }
  }, [online, stats.queuedCount]);

  const updateStats = async () => {
    const offlineStats = await getOfflineStats();
    setStats(offlineStats);
  };

  // Don't show anything if online and no queued items
  if (online && stats.queuedCount === 0 && stats.draftsCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
      >
        <div className="container mx-auto px-4 pt-4">
          <motion.div
            className={`
              pointer-events-auto rounded-lg shadow-lg p-3 flex items-center gap-3
              ${online 
                ? 'bg-green-500/90 text-white' 
                : 'bg-orange-500/90 text-white'
              }
            `}
            layout
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              {online ? (
                syncing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <CloudOff className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <Wifi className="h-5 w-5" />
                )
              ) : (
                <WifiOff className="h-5 w-5" />
              )}
            </div>

            {/* Message */}
            <div className="flex-1 text-sm font-medium">
              {online ? (
                syncing ? (
                  <span>Syncing {stats.queuedCount} offline complaints...</span>
                ) : (
                  <span>Back online! Complaints synced.</span>
                )
              ) : (
                <div>
                  <div>You're offline</div>
                  {(stats.queuedCount > 0 || stats.draftsCount > 0) && (
                    <div className="text-xs opacity-90 mt-0.5">
                      {stats.queuedCount > 0 && `${stats.queuedCount} queued`}
                      {stats.queuedCount > 0 && stats.draftsCount > 0 && ', '}
                      {stats.draftsCount > 0 && `${stats.draftsCount} drafts`}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineIndicator;
