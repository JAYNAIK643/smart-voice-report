const twilio = require("twilio");
const SMSLog = require("../models/SMSLog");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

let client;
// Only initialize Twilio client if credentials are valid (not placeholder values)
if (accountSid && authToken && accountSid.startsWith('AC') && authToken.length > 10) {
  try {
    client = twilio(accountSid, authToken);
    console.log("✅ Twilio client initialized successfully");
  } catch (error) {
    console.warn("⚠️ Failed to initialize Twilio client:", error.message);
  }
} else {
  console.log("ℹ️ Twilio credentials not configured - SMS features will be disabled");
}

/**
 * Send SMS notification
 */
const sendSMS = async ({ to, message, messageType, userId, grievanceId }) => {
  // Check if Twilio is enabled via feature flag / env
  if (process.env.ENABLE_SMS !== "true") {
    console.log("📱 SMS delivery skipped (Feature Flag ENABLE_SMS is not true)");
    return { success: false, message: "SMS service disabled" };
  }

  if (!client || !fromPhone) {
    console.warn("⚠️ Twilio credentials not configured. SMS will not be sent.");
    return { success: false, message: "Twilio not configured" };
  }

  if (!to) {
    console.warn("⚠️ No recipient phone number provided.");
    return { success: false, message: "Missing phone number" };
  }

  try {
    const twilioResponse = await client.messages.create({
      body: message,
      from: fromPhone,
      to: to,
    });

    // Log the SMS
    await SMSLog.create({
      messageId: twilioResponse.sid,
      phoneNumber: to,
      messageType,
      content: message,
      deliveryStatus: twilioResponse.status,
      userId,
      grievanceId,
    });

    console.log(`✅ SMS sent successfully to: ${to} (SID: ${twilioResponse.sid})`);
    return { success: true, sid: twilioResponse.sid };
  } catch (error) {
    console.error("❌ SMS delivery failed:", error.message);
    
    // Log the failure
    await SMSLog.create({
      phoneNumber: to,
      messageType,
      content: message,
      deliveryStatus: "failed",
      error: error.message,
      userId,
      grievanceId,
    });

    return { success: false, error: error.message };
  }
};

/**
 * Send grievance confirmation SMS
 */
const sendGrievanceConfirmationSMS = async (user, grievanceData) => {
  const language = user.preferredLanguage || "en";
  
  const messages = {
    en: `Your grievance has been registered successfully. ID: ${grievanceData.complaintId}. Title: ${grievanceData.title}`,
    hi: `आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है। आईडी: ${grievanceData.complaintId}. शीर्षक: ${grievanceData.title}`,
    // Add more languages as needed
  };

  const message = messages[language] || messages.en;

  return await sendSMS({
    to: user.phone,
    message,
    messageType: "registration",
    userId: user._id,
    grievanceId: grievanceData._id,
  });
};

/**
 * Send status update SMS
 */
const sendStatusUpdateSMS = async (user, grievanceData) => {
  const language = user.preferredLanguage || "en";
  const status = grievanceData.status.toLowerCase();
  
  let messages;
  if (status === "resolved") {
    messages = {
      en: `GOOD NEWS! Your grievance (ID: ${grievanceData.complaintId}) has been RESOLVED. Thank you for using our system.`,
      hi: `अच्छी खबर! आपकी शिकायत (आईडी: ${grievanceData.complaintId}) का समाधान हो गया है। हमारे सिस्टम का उपयोग करने के लिए धन्यवाद।`,
    };
  } else {
    messages = {
      en: `The status of your grievance (ID: ${grievanceData.complaintId}) has been updated to: ${status.toUpperCase()}`,
      hi: `आपकी शिकायत (आईडी: ${grievanceData.complaintId}) की स्थिति अपडेट की गई है: ${status.toUpperCase()}`,
    };
  }

  const message = messages[language] || messages.en;

  return await sendSMS({
    to: user.phone,
    message,
    messageType: status === "resolved" ? "resolution" : "status_update",
    userId: user._id,
    grievanceId: grievanceData._id,
  });
};

/**
 * Send critical alert SMS
 * Bypasses preferences for emergency situations if needed, 
 * but here we follow the task of adding it as a specific method.
 */
const sendCriticalAlertSMS = async (user, alertData) => {
  const language = user.preferredLanguage || "en";
  
  const messages = {
    en: `CRITICAL ALERT: ${alertData.title}. Details: ${alertData.message}`,
    hi: `आपातकालीन सूचना: ${alertData.title}. विवरण: ${alertData.message}`,
  };

  const message = messages[language] || messages.en;

  return await sendSMS({
    to: user.phone,
    message,
    messageType: "critical_alert",
    userId: user._id,
  });
};

module.exports = {
  sendSMS,
  sendGrievanceConfirmationSMS,
  sendStatusUpdateSMS,
  sendCriticalAlertSMS,
};
