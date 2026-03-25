import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  userId: string;
  type: "complaint_submitted" | "status_update" | "complaint_resolved" | "general";
  title: string;
  message: string;
  complaintId?: string;
}

const getEmailTemplate = (type: string, title: string, message: string, complaintId?: string) => {
  const baseStyles = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `;
  
  const headerColor = {
    complaint_submitted: "#3b82f6",
    status_update: "#f59e0b",
    complaint_resolved: "#22c55e",
    general: "#6366f1"
  }[type] || "#6366f1";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="background-color: #f3f4f6; padding: 20px;">
      <div style="${baseStyles} background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background-color: ${headerColor}; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🏛️ Grievance Redressal System</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">${title}</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${message}</p>
          
          ${complaintId ? `
            <div style="background-color: #f9fafb; border-left: 4px solid ${headerColor}; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>Complaint ID:</strong> ${complaintId}
              </p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${Deno.env.get("SITE_URL") || "https://your-site.lovable.app"}/track-complaint" 
               style="display: inline-block; background-color: ${headerColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Track Your Complaint
            </a>
          </div>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            This is an automated notification from the Grievance Redressal System.
            <br>Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Email notification function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, type, title, message, complaintId }: EmailNotificationRequest = await req.json();
    
    console.log("Processing email for user:", userId);
    console.log("Notification type:", type);

    // Get user email from auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user?.email) {
      console.error("Error fetching user:", userError);
      throw new Error("Could not fetch user email");
    }

    const userEmail = userData.user.email;
    console.log("Sending email to:", userEmail);

    // Send the email
    const emailResponse = await resend.emails.send({
      from: "Grievance System <notifications@resend.dev>",
      to: [userEmail],
      subject: title,
      html: getEmailTemplate(type, title, message, complaintId),
    });

    console.log("Email sent successfully:", emailResponse);

    // Also create an in-app notification
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type: type === "complaint_resolved" ? "success" : type === "status_update" ? "warning" : "info",
        title: title,
        message: message,
        read: false
      });

    if (notifError) {
      console.error("Error creating in-app notification:", notifError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id || "sent",
        sentTo: userEmail 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email-notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Make sure RESEND_API_KEY is configured correctly"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
