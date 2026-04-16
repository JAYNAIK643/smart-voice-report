// const nodemailer = require("nodemailer");

// // Create email transporter
// const createTransporter = () => {
//   // Check if email credentials are configured
//   if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//     console.warn("⚠️ Email credentials not configured. Emails will not be sent.");
//     return null;
//   }

//   try {
//     return nodemailer.createTransporter({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Failed to create email transporter:", error.message);
//     return null;
//   }
// };

// /**
//  * Send grievance confirmation email
//  */
// const sendGrievanceConfirmation = async (userEmail, grievanceData) => {
//   const transporter = createTransporter();
  
//   if (!transporter) {
//     console.log("📧 Email skipped (not configured):", grievanceData.complaintId);
//     return { success: false, message: "Email not configured" };
//   }

//   const mailOptions = {
//     from: process.env.EMAIL_FROM || "SmartCity GRS <noreply@smartcity.com>",
//     to: userEmail,
//     subject: `Grievance Registered Successfully | ID: ${grievanceData.complaintId}`,
//     html: `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//           .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//           .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
//           .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
//           .grievance-id { background: #667eea; color: white; padding: 10px 20px; display: inline-block; border-radius: 5px; font-weight: bold; margin: 20px 0; }
//           .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
//           .footer { text-align: center; color: #777; padding: 20px; font-size: 12px; }
//           .status-badge { background: #fbbf24; color: #78350f; padding: 5px 15px; border-radius: 20px; display: inline-block; font-size: 14px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>🏛️ SmartCity GRS</h1>
//             <p>Your Grievance Has Been Registered</p>
//           </div>
//           <div class="content">
//             <h2>Thank You for Reporting!</h2>
//             <p>Your complaint has been successfully registered in our system. Our team will review and address it as soon as possible.</p>
            
//             <div class="grievance-id">
//               Grievance ID: ${grievanceData.complaintId}
//             </div>
            
//             <div class="info-box">
//               <h3>📋 Complaint Details:</h3>
//               <p><strong>Title:</strong> ${grievanceData.title}</p>
//               <p><strong>Category:</strong> ${grievanceData.category}</p>
//               <p><strong>Status:</strong> <span class="status-badge">${grievanceData.status.toUpperCase()}</span></p>
//               <p><strong>Priority:</strong> ${grievanceData.priority}</p>
//               ${grievanceData.address ? `<p><strong>Location:</strong> ${grievanceData.address}</p>` : ""}
//             </div>
            
//             <div class="info-box">
//               <h3>📌 What Happens Next?</h3>
//               <ul>
//                 <li>Your complaint will be reviewed by our admin team</li>
//                 <li>You'll receive updates via email as the status changes</li>
//                 <li>Track your complaint status anytime using the Grievance ID</li>
//               </ul>
//             </div>
            
//             <p><strong>Important:</strong> Please save your Grievance ID (${grievanceData.complaintId}) for future reference.</p>
//           </div>
//           <div class="footer">
//             <p>This is an automated email. Please do not reply.</p>
//             <p>&copy; 2026 SmartCity Grievance Redressal System. All rights reserved.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log("✅ Email sent successfully to:", userEmail);
//     return { success: true };
//   } catch (error) {
//     console.error("❌ Email sending failed:", error.message);
//     return { success: false, error: error.message };
//   }
// };

// /**
//  * Send status update email
//  */
// const sendStatusUpdateEmail = async (userEmail, grievanceData) => {
//   const transporter = createTransporter();
  
//   if (!transporter) {
//     console.log("📧 Email skipped (not configured)");
//     return { success: false, message: "Email not configured" };
//   }

//   const statusColors = {
//     pending: "#fbbf24",
//     "in-progress": "#3b82f6",
//     resolved: "#10b981",
//   };

//   const statusIcons = {
//     pending: "⏳",
//     "in-progress": "🔄",
//     resolved: "✅",
//   };

//   const mailOptions = {
//     from: process.env.EMAIL_FROM || "SmartCity GRS <noreply@smartcity.com>",
//     to: userEmail,
//     subject: `Grievance Status Updated | ID: ${grievanceData.complaintId}`,
//     html: `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//           .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//           .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
//           .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
//           .status-badge { padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 20px 0; color: white; background: ${statusColors[grievanceData.status] || "#gray"}; }
//           .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
//           .footer { text-align: center; color: #777; padding: 20px; font-size: 12px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>🏛️ SmartCity GRS</h1>
//             <p>Grievance Status Update</p>
//           </div>
//           <div class="content">
//             <h2>${statusIcons[grievanceData.status]} Status Updated</h2>
//             <p>The status of your grievance has been updated.</p>
            
//             <div class="status-badge">
//               ${grievanceData.status.toUpperCase()}
//             </div>
            
//             <div class="info-box">
//               <p><strong>Grievance ID:</strong> ${grievanceData.complaintId}</p>
//               <p><strong>Title:</strong> ${grievanceData.title}</p>
//               <p><strong>New Status:</strong> ${grievanceData.status}</p>
//             </div>
            
//             ${grievanceData.status === "resolved" ? `
//             <div class="info-box" style="border-left-color: #10b981;">
//               <h3>🎉 Resolved!</h3>
//               <p>Your grievance has been successfully resolved. Thank you for helping us improve our city!</p>
//             </div>
//             ` : ""}
//           </div>
//           <div class="footer">
//             <p>This is an automated email. Please do not reply.</p>
//             <p>&copy; 2026 SmartCity Grievance Redressal System. All rights reserved.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log("✅ Status update email sent to:", userEmail);
//     return { success: true };
//   } catch (error) {
//     console.error("❌ Email sending failed:", error.message);
//     return { success: false, error: error.message };
//   }
// };

// module.exports = {
//   sendGrievanceConfirmation,
//   sendStatusUpdateEmail,
// };
console.log("📧 emailService.js loaded");

const nodemailer = require("nodemailer");

const createSendGridTransporter = () => {
  if (!process.env.SENDGRID_API_KEY) return null;
  return nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  });
};

const createGmailTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const getAvailableProviders = () => {
  const providers = [];
  if (process.env.SENDGRID_API_KEY) {
    providers.push({ name: "SendGrid", transporter: createSendGridTransporter() });
  }
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    providers.push({ name: "Gmail", transporter: createGmailTransporter() });
  }
  return providers.filter((p) => !!p.transporter);
};

const getSenderAddress = () =>
  process.env.EMAIL_FROM ||
  process.env.SENDGRID_FROM_EMAIL ||
  process.env.EMAIL_USER ||
  "SmartCity GRS <noreply@smartcityportal.com>";

const sendEmailWithFallback = async (mailOptions) => {
  const providers = getAvailableProviders();
  console.log("📧 Email provider config:", {
    hasSendGridKey: !!process.env.SENDGRID_API_KEY,
    hasEmailUser: !!process.env.EMAIL_USER,
    hasEmailPass: !!process.env.EMAIL_PASS,
    sender: getSenderAddress(),
    availableProviders: providers.map((p) => p.name),
  });

  if (providers.length === 0) {
    return { success: false, error: "Email service not configured (missing SMTP credentials)" };
  }

  let lastError = null;
  for (const provider of providers) {
    try {
      console.log(`📧 Attempting email send via ${provider.name}`);
      await provider.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent via ${provider.name}`);
      return { success: true, provider: provider.name };
    } catch (err) {
      lastError = err;
      console.error(`EMAIL ERROR (${provider.name}):`, err.message);
    }
  }

  return { success: false, error: lastError?.message || "Unknown email delivery error" };
};

// Email template helper function
const generateEmailTemplate = (title, content, data) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8082';
  const trackUrl = `${frontendUrl}/track`;
  
  // Status badge styling based on status
  const statusColors = {
    'pending': { bg: '#fff7ed', text: '#ea580c', label: 'PENDING' },
    'in-progress': { bg: '#eff6ff', text: '#2563eb', label: 'IN PROGRESS' },
    'resolved': { bg: '#f0fdf4', text: '#16a34a', label: 'RESOLVED' }
  };
  
  const status = statusColors[data.status] || statusColors['pending'];
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; background-color: #f5f7fa; color: #333333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">Smart City Grievance Redressal System</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${title}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">Dear Citizen,</p>
              ${content}

              <!-- Complaint ID Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0; color: #1e40af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Complaint ID</p>
                    <p style="margin: 8px 0 0; color: #1e40af; font-size: 28px; font-weight: 700;">${data.complaintId}</p>
                  </td>
                </tr>
              </table>

              <!-- Complaint Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Complaint Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${data.title ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Title:</span>
                          <span style="color: #111827; font-size: 14px; font-weight: 500; margin-left: 8px;">${data.title}</span>
                        </td>
                      </tr>` : ''}
                      ${data.category ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Category:</span>
                          <span style="color: #111827; font-size: 14px; font-weight: 500; margin-left: 8px;">${data.category}</span>
                        </td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Status:</span>
                          <span style="color: ${status.text}; font-size: 14px; font-weight: 600; margin-left: 8px; background-color: ${status.bg}; padding: 4px 12px; border-radius: 4px;">${status.label}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="text-align: center; margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${trackUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">Track Your Complaint</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">Please save your Complaint ID for future reference. You can track the status of your complaint anytime using this ID.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">This is an automated message. Please do not reply to this email.</p>
                    <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280;">For support, contact: support@smartcityportal.com</p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">&copy; 2026 Smart City Grievance Redressal System. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Send grievance confirmation email
 */
const sendGrievanceConfirmation = async (userEmail, grievanceData) => {
  console.log(`📧 Preparing grievance confirmation email for: ${userEmail}`);
  console.log(`   Complaint ID: ${grievanceData.complaintId}`);
  console.log(`   Title: ${grievanceData.title}`);
  console.log(`   Priority: ${grievanceData.priority || 'not provided'}`);
  
  const content = `
    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6;">Your grievance has been successfully submitted to the Smart City Grievance Redressal System. Our team will review and address it as soon as possible.</p>
    
    <!-- Highlighted Complaint ID -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <tr>
        <td>
          <p style="margin: 0 0 8px; color: #1e40af; font-size: 14px; font-weight: 600;">YOUR COMPLAINT ID:</p>
          <p style="margin: 0; color: #1e40af; font-size: 24px; font-weight: 700; letter-spacing: 1px;">${grievanceData.complaintId}</p>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 20px; font-size: 14px; color: #6b7280; line-height: 1.5;">Please save this ID for future reference. You can track your complaint status using this ID at any time.</p>`;
  
  const html = generateEmailTemplate('Grievance Submitted Successfully', content, {
    complaintId: grievanceData.complaintId,
    title: grievanceData.title,
    category: grievanceData.category,
    status: 'pending'
  });

  const mailOptions = {
    from: getSenderAddress(),
    to: userEmail,
    subject: `Grievance Registered Successfully - ID: ${grievanceData.complaintId}`,
    html: html,
  };

  try {
    console.log(`📧 Sending grievance confirmation email to: ${userEmail}`);
    const emailResult = await sendEmailWithFallback(mailOptions);
    if (!emailResult.success) {
      console.error("EMAIL ERROR:", emailResult.error);
      return { success: false, error: emailResult.error };
    }
    console.log("✅ Grievance confirmation email sent successfully to:", userEmail);
    return { success: true };
  } catch (error) {
    console.error("❌ Grievance confirmation email sending failed:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send status update email
 */
const sendStatusUpdateEmail = async (userEmail, grievanceData) => {
  console.log(`📧 Preparing status update email for: ${userEmail}`);
  console.log(`   Complaint ID: ${grievanceData.complaintId}`);
  console.log(`   Title: ${grievanceData.title}`);
  console.log(`   Status: ${grievanceData.status}`);
  
  // Dynamic content based on status
  let statusMessage = '';
  if (grievanceData.status === 'resolved') {
    statusMessage = `<p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6;">Great news! Your grievance has been successfully resolved. Thank you for helping us improve our city.</p>`;
  } else if (grievanceData.status === 'in-progress') {
    statusMessage = `<p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6;">Your grievance is now being looked into by our team. We will keep you updated on any progress.</p>`;
  } else {
    statusMessage = `<p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6;">Your grievance status has been updated. Please check the details below.</p>`;
  }

  const html = generateEmailTemplate('Grievance Status Updated', statusMessage, {
    complaintId: grievanceData.complaintId,
    title: grievanceData.title,
    category: grievanceData.category,
    status: grievanceData.status
  });

  const mailOptions = {
    from: getSenderAddress(),
    to: userEmail,
    subject: `Grievance Status Updated - ID: ${grievanceData.complaintId}`,
    html: html,
  };

  try {
    console.log(`📧 Sending status update email to: ${userEmail}`);
    const emailResult = await sendEmailWithFallback(mailOptions);
    if (!emailResult.success) {
      console.error("EMAIL ERROR:", emailResult.error);
      return { success: false, error: emailResult.error };
    }
    console.log("✅ Status update email sent to:", userEmail);
    return { success: true };
  } catch (error) {
    console.error("❌ Status email failed:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Ward Admin invitation email
 */
const sendWardAdminInvitationEmail = async (userEmail, userName, ward, verificationLink) => {
  const mailOptions = {
    from: getSenderAddress(),
    to: userEmail,
    subject: `Ward Admin Invitation - ${ward} | SmartCity GRS`,
    html: `<!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0;
          background-color: #f5f7fa;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 30px; 
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .header p {
          margin: 10px 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content { 
          padding: 30px;
        }
        .welcome {
          font-size: 20px;
          color: #2d3748;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .info-box {
          background: #f8fafc;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        .info-box h3 {
          margin-top: 0;
          color: #4a5568;
        }
        .info-item {
          margin: 10px 0;
          display: flex;
        }
        .info-label {
          font-weight: 600;
          width: 120px;
          color: #4a5568;
        }
        .ward-badge {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          margin: 15px 0;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background: #5a67d8;
        }
        .instructions {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 20px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        .footer {
          text-align: center;
          color: #718096;
          padding: 20px;
          font-size: 12px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .note {
          font-size: 14px;
          color: #718096;
          margin-top: 20px;
          padding: 15px;
          background: #f1f5f9;
          border-radius: 6px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏛️ SmartCity GRS</h1>
          <p>Ward Administration Invitation</p>
        </div>
        <div class="content">
          <div class="welcome">Hello ${userName},</div>
          
          <p>You have been invited to serve as a Ward Administrator for <strong>${ward}</strong> in the SmartCity Grievance Redressal System.</p>
          
          <div class="info-box">
            <h3>📋 Invitation Details:</h3>
            <div class="info-item">
              <span class="info-label">Ward:</span>
              <span><strong>${ward}</strong></span>
            </div>
            <div class="info-item">
              <span class="info-label">Role:</span>
              <span>Ward Administrator</span>
            </div>
            <div class="info-item">
              <span class="info-label">System:</span>
              <span>SmartCity Grievance Redressal System</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <span class="ward-badge">${ward} Administrator</span>
          </div>
          
          <p>To accept this invitation and create your account, please click the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationLink}" class="button">Accept Invitation & Create Account</a>
          </div>
          
          <div class="instructions">
            <h3>📌 Important Instructions:</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This invitation link is valid for 7 days</li>
              <li>You will be asked to set a secure password (10-12 characters with letters and numbers)</li>
              <li>Your account will be automatically assigned to ${ward}</li>
              <li>After setup, you can login to manage complaints in your ward</li>
            </ul>
          </div>
          
          <div class="note">
            <strong>Note:</strong> If you did not expect this invitation or believe it was sent in error, please ignore this email. No account will be created without your explicit confirmation.
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email from SmartCity Grievance Redressal System.</p>
          <p>Please do not reply to this email.</p>
          <p>&copy; 2026 SmartCity Municipal Corporation. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`
  };

  try {
    console.log(`📧 Sending ward admin invitation email to: ${userEmail}`);
    const emailResult = await sendEmailWithFallback(mailOptions);
    if (!emailResult.success) {
      console.error("EMAIL ERROR:", emailResult.error);
      return { success: false, error: emailResult.error };
    }
    console.log("✅ Ward Admin invitation email sent successfully to:", userEmail);
    return { success: true };
  } catch (error) {
    console.error("EMAIL ERROR:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send critical alert email
 */
const sendCriticalAlert = async (userEmail, alertData) => {
  console.log(`📧 Preparing critical alert email for: ${userEmail}`);
  console.log(`   Title: ${alertData.title}`);
  console.log(`   Complaint ID: ${alertData.complaintId || 'not provided'}`);
  console.log(`   Message: ${alertData.message}`);
  
  const mailOptions = {
    from: getSenderAddress(),
    to: userEmail,
    subject: `🚨 CRITICAL ALERT: ${alertData.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CRITICAL ALERT</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; background-color: #f5f7fa; color: #333333;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">🚨 CRITICAL ALERT</h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${alertData.title}</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">Dear Citizen,</p>
                    <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6;">${alertData.message}</p>
                    
                    ${alertData.complaintId ? `
                    <!-- Complaint ID Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <p style="margin: 0; color: #dc2626; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Complaint ID</p>
                          <p style="margin: 8px 0 0; color: #dc2626; font-size: 28px; font-weight: 700;">${alertData.complaintId}</p>
                        </td>
                      </tr>
                    </table>` : ''}
                    
                    <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">This is an urgent notification requiring immediate attention.</p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="text-align: center;">
                          <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">This is an automated critical alert. Please do not reply to this email.</p>
                          <p style="margin: 0; font-size: 12px; color: #9ca3af;">&copy; 2026 Smart City Grievance Redressal System. All rights reserved.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    console.log(`📧 Sending critical alert email to: ${userEmail}`);
    const emailResult = await sendEmailWithFallback(mailOptions);
    if (!emailResult.success) {
      console.error("EMAIL ERROR:", emailResult.error);
      return { success: false, error: emailResult.error };
    }
    console.log("✅ Critical alert email sent to:", userEmail);
    return { success: true };
  } catch (error) {
    console.error("❌ Critical alert email failed:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendGrievanceConfirmation,
  sendStatusUpdateEmail,
  sendCriticalAlert,
  sendWardAdminInvitationEmail,
};
