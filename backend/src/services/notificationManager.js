const emailService = require("./emailService");
const smsService = require("./smsService");

/**
 * Orchestrate notifications based on user preferences
 */
const notify = async (user, type, data) => {
  const notifications = [];

  // 1. Email Notification
  if (user.emailEnabled !== false) { // Default to true if not set
    const emailPromise = (async () => {
      try {
        console.log(`📧 Preparing ${type} notification for ${user.email}`);
        if (type === "registration") {
          console.log("   -> Sending grievance confirmation");
          return await emailService.sendGrievanceConfirmation(user.email, data);
        } else if (type === "status_update") {
          console.log("   -> Sending status update");
          return await emailService.sendStatusUpdateEmail(user.email, data);
        }
      } catch (err) {
        console.error("📧 Email Notification failed in Manager:", err.message);
        return { success: false, error: err.message };
      }
    })();
    notifications.push(emailPromise);
  }

  // 2. SMS Notification
  if (user.smsEnabled === true && user.phone) {
    const smsPromise = (async () => {
      try {
        if (type === "registration") {
          return await smsService.sendGrievanceConfirmationSMS(user, data);
        } else if (type === "status_update") {
          return await smsService.sendStatusUpdateSMS(user, data);
        } else if (type === "critical_alert") {
          return await smsService.sendCriticalAlertSMS(user, data);
        }
      } catch (err) {
        console.error("📱 SMS Notification failed in Manager:", err.message);
        return { success: false, error: err.message };
      }
    })();
    notifications.push(smsPromise);
  }

  // Execute all (safely)
  // We use Promise.allSettled or just let them run to ensure one failure doesn't stop others
  const results = await Promise.allSettled(notifications);
  
  return results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason });
};

/**
 * Instant critical alert 
 * Bypasses preferences for SMS if it's an emergency, but still respects ENABLE_SMS flag
 */
const sendCriticalAlert = async (user, alertData) => {
  const notifications = [];
  
  // 1. Email (Always send for critical)
  notifications.push((async () => {
    try {
      return await emailService.sendCriticalAlert(user.email, alertData);
    } catch (err) {
      console.error("📧 Critical Email failed:", err.message);
      return { success: false, error: err.message };
    }
  })());

  // 2. SMS (Send if phone exists, even if smsEnabled is false, as it's critical/emergency)
  if (user.phone) {
    notifications.push((async () => {
      try {
        return await smsService.sendCriticalAlertSMS(user, alertData);
      } catch (err) {
        console.error("📱 Critical SMS failed:", err.message);
        return { success: false, error: err.message };
      }
    })());
  }

  const results = await Promise.allSettled(notifications);
  return results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason });
};

module.exports = {
  notify,
  sendCriticalAlert,
};
