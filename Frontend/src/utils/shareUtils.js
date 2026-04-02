/**
 * Share Utilities - Mobile Experience Enhancement
 * Social sharing and export functionality
 * 
 * Features:
 * - Native Web Share API
 * - WhatsApp sharing
 * - SMS sharing
 * - QR code generation
 * - Copy to clipboard
 */

import { useToast } from '@/hooks/use-toast';

/**
 * Check if native share is supported
 */
export const isNativeShareSupported = () => {
  return typeof navigator !== 'undefined' && 
         'share' in navigator && 
         typeof navigator.share === 'function';
};

/**
 * Check if clipboard API is supported
 */
export const isClipboardSupported = () => {
  return typeof navigator !== 'undefined' && 
         'clipboard' in navigator && 
         typeof navigator.clipboard.writeText === 'function';
};

/**
 * Native Web Share API
 * @param {Object} data - Share data
 * @param {string} data.title - Share title
 * @param {string} data.text - Share text
 * @param {string} data.url - Share URL
 * @returns {Promise<boolean>} Success status
 */
export const nativeShare = async (data) => {
  if (!isNativeShareSupported()) {
    return false;
  }

  try {
    await navigator.share({
      title: data.title || 'SmartCity GRS',
      text: data.text || '',
      url: data.url || window.location.href
    });
    return true;
  } catch (error) {
    // User cancelled or share failed
    if (error.name !== 'AbortError') {
      console.error('Native share failed:', error);
    }
    return false;
  }
};

/**
 * Share via WhatsApp
 * @param {Object} data - Share data
 * @returns {void}
 */
export const shareViaWhatsApp = (data) => {
  const text = encodeURIComponent(`${data.title}\n\n${data.text}\n\n${data.url || window.location.href}`);
  const whatsappUrl = `https://wa.me/?text=${text}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Share via SMS
 * @param {Object} data - Share data
 * @returns {void}
 */
export const shareViaSMS = (data) => {
  const text = encodeURIComponent(`${data.title}\n\n${data.text}\n\n${data.url || window.location.href}`);
  const smsUrl = `sms:?body=${text}`;
  window.location.href = smsUrl;
};

/**
 * Share via Email
 * @param {Object} data - Share data
 * @returns {void}
 */
export const shareViaEmail = (data) => {
  const subject = encodeURIComponent(data.title || 'SmartCity GRS');
  const body = encodeURIComponent(`${data.text}\n\n${data.url || window.location.href}`);
  const emailUrl = `mailto:?subject=${subject}&body=${body}`;
  window.location.href = emailUrl;
};

/**
 * Copy to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  if (!isClipboardSupported()) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('Fallback copy failed:', err);
      return false;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Clipboard copy failed:', error);
    return false;
  }
};

/**
 * Generate QR code URL
 * @param {string} data - Data to encode
 * @param {number} size - QR code size
 * @returns {string} QR code image URL
 */
export const generateQRCode = (data, size = 200) => {
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`;
};

/**
 * Share complaint data
 * @param {Object} complaint - Complaint object
 * @returns {Object} Formatted share data
 */
export const formatComplaintShareData = (complaint) => {
  return {
    title: `Complaint: ${complaint.title || 'Untitled'}`,
    text: `Status: ${complaint.status || 'Pending'}\nCategory: ${complaint.category || 'General'}\n\n${complaint.description?.substring(0, 100) || ''}...`,
    url: `${window.location.origin}/track?complaintId=${complaint._id || complaint.id}`
  };
};

/**
 * Share leaderboard position
 * @param {Object} user - User object
 * @param {number} rank - User rank
 * @returns {Object} Formatted share data
 */
export const formatLeaderboardShareData = (user, rank) => {
  const rankText = rank === 1 ? '🥇 1st' : rank === 2 ? '🥈 2nd' : rank === 3 ? '🥉 3rd' : `#${rank}`;
  return {
    title: `I'm ranked ${rankText} on SmartCity GRS!`,
    text: `Check out my civic engagement score and join the leaderboard!`,
    url: window.location.href
  };
};

/**
 * Hook for sharing with toast notifications
 * @returns {Object} Share utilities with toast
 */
export const useShare = () => {
  const { toast } = useToast();

  const shareWithToast = async (data) => {
    const success = await nativeShare(data);
    
    if (success) {
      toast({
        title: 'Shared successfully',
        description: 'Content shared via native share'
      });
    }
    
    return success;
  };

  const copyWithToast = async (text, label = 'Link') => {
    const success = await copyToClipboard(text);
    
    if (success) {
      toast({
        title: 'Copied to clipboard',
        description: `${label} copied successfully`
      });
    } else {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive'
      });
    }
    
    return success;
  };

  return {
    isNativeShareSupported: isNativeShareSupported(),
    isClipboardSupported: isClipboardSupported(),
    nativeShare: shareWithToast,
    shareViaWhatsApp,
    shareViaSMS,
    shareViaEmail,
    copyToClipboard: copyWithToast,
    generateQRCode,
    formatComplaintShareData,
    formatLeaderboardShareData
  };
};

export default {
  isNativeShareSupported,
  isClipboardSupported,
  nativeShare,
  shareViaWhatsApp,
  shareViaSMS,
  shareViaEmail,
  copyToClipboard,
  generateQRCode,
  formatComplaintShareData,
  formatLeaderboardShareData,
  useShare
};
