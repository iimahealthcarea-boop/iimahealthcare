import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const handler = async (req) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "iimahealthcarea@gmail.com",
      pass: "dbnl ykcv mygi miel",
    },
  });
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  try {
    // Verify the user is authenticated and is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    // Only admins can send approval/rejection emails
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin access required" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const { email, name, status, reason, profile, appUrl } = await req.json();
    console.log(`Sending ${status} email to ${email} for user ${name}`);
    const siteUrl = (
      appUrl ||
      Deno.env.get("SITE_URL") ||
      "https://www.iimahealthcare.in"
    ).replace(/\/$/, "");
    const resubmitUrl = `${siteUrl}/registration`;
    let subject;
    let htmlContent;
    if (status === "approved") {
      subject = "IIM-AMS Registration Approved! Welcome to the Community";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            IIM-AMS Alumni Management System
          </h1>
          
          <h2 style="color: #16a34a;">Congratulations! Your Registration has been Approved</h2>
          
          <p>Dear ${name},</p>
          
          <p>We are pleased to inform you that your registration with IIM-AMS has been <strong>approved</strong>!</p>
          
          <p>You can now access the full features of our alumni platform, including:</p>
          <ul>
            <li>Member directory and networking opportunities</li>
            <li>Profile management and updates</li>
            <li>Access to exclusive alumni resources</li>
            <li>Event notifications and updates</li>
          </ul>
          
          <p>Please log in to your account to get started and explore all the available features.</p>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          
          <p>Welcome to the IIM-AMS community!</p>
          
          <p>Best regards,<br>
          The IIM-AMS Admin Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            This is an automated message from IIM-AMS Alumni Management System
          </p>
        </div>
      `;
    } else {
      subject =
        "Action required: Please revise and resubmit your IIM-AMS application";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
          <h1 style="color: #2563eb; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            IIM-AMS Alumni Management System
          </h1>

          <h2 style="color: #dc2626;">Your application needs a few changes</h2>

          <p>Dear ${name},</p>

          <p>Thank you for applying to join the IIM-AMS Healthcare SIG alumni community. Our review team has looked at the details you submitted and asked you to update your application before we can approve it.</p>

          ${
            reason
              ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 8px;">Feedback from the review team</h3>
              <p style="margin: 0; white-space: pre-wrap;">${reason}</p>
            </div>
          `
              : `
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0;">The review team did not include specific feedback. Please double-check all required fields (name, contact details, program, graduation year, current organization, LinkedIn, bio) and resubmit.</p>
            </div>
          `
          }

          <h3 style="color: #111827; margin-top: 24px;">What happens next</h3>
          <ol style="padding-left: 20px; line-height: 1.7;">
            <li>Click the button below to open your application.</li>
            <li>Review the feedback above and update the relevant sections of your profile.</li>
            <li>Submit the form. Your application will return to the review queue automatically.</li>
            <li>You'll receive another email as soon as the review team responds.</li>
          </ol>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resubmitUrl}"
               style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600;">
              Update &amp; Resubmit Application
            </a>
            <p style="font-size: 12px; color: #6b7280; margin-top: 12px;">
              Or copy this link into your browser:<br>
              <a href="${resubmitUrl}" style="color: #2563eb;">${resubmitUrl}</a>
            </p>
          </div>

          <p>If you believe this was a mistake or you need help updating your information, just reply to this email and our team will get back to you.</p>

          <p>Best regards,<br>
          The IIM-AMS Admin Team</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            This is an automated message from IIM-AMS Alumni Management System
          </p>
        </div>
      `;
    }
    const emailResponse = await transporter.sendMail({
      from: `"IIM-AMS Admin Notifier" <iimahealthcarea@gmail.com>`,
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);
    return new Response(
      JSON.stringify({
        success: true,
        emailResponse,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  } catch (error) {
    console.error("Error in send-approval-email function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
};
serve(handler);
