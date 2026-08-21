import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
// Hardcoded admin email
const ADMIN_EMAIL = "iimahealthcarea@gmail.com";
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "";
const SMTP_APP_PASSWORD = Deno.env.get("SMTP_PASSOWRD") ?? "";
// Base URL for links in the email; falls back to the production site.
const siteUrl = (Deno.env.get("SITE_URL") ?? "https://www.iimahealthcare.in").replace(/\/$/, "");
// Function to send signup email
const sendSignupEmail = async (firstName, lastName, userEmail) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_APP_PASSWORD,
    },
  });
  const htmlContent = `
    <div style="margin:0;padding:24px 12px;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <!-- Header -->
        <tr>
          <td style="background-color:#1d4ed8;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.2px;">
              IIMA Healthcare SIG Directory
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <div style="display:inline-block;background-color:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding:6px 12px;border-radius:6px;">
              Pending approval
            </div>

            <h2 style="margin:16px 0 0;color:#0f172a;font-size:22px;font-weight:700;line-height:1.3;">
              New member signup awaiting review
            </h2>

            <p style="margin:16px 0 0;color:#475569;font-size:15px;line-height:1.6;">
              A new user has registered and is waiting for approval.
            </p>

            <!-- Applicant details -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:700;">
                    Applicant details
                  </p>
                  <p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.5;">
                    <strong style="color:#0f172a;">Name:</strong>&nbsp; ${firstName} ${lastName}
                  </p>
                  <p style="margin:0;color:#475569;font-size:14px;line-height:1.5;word-break:break-all;">
                    <strong style="color:#0f172a;">Email:</strong>&nbsp; ${userEmail}
                  </p>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
              <tr>
                <td style="background-color:#1d4ed8;border-radius:8px;">
                  <a href="${siteUrl}/admin"
                     style="display:inline-block;padding:13px 30px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                    Review in Admin Panel
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;color:#64748b;font-size:14px;line-height:1.6;">
              Approve or request changes from the admin dashboard.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
              This is an automated message from the IIMA Healthcare SIG Directory.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
  return await transporter.sendMail({
    from: `"IIMA Healthcare SIG Directory" <${SMTP_USER}>`,
    to: ADMIN_EMAIL,
    subject: "New User Signup Pending Approval",
    html: htmlContent,
  });
};
// Dedicated handler for signup emails
const handler = async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  try {
    // Verify the user is authenticated
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
    const { createClient } =
      await import("https://esm.sh/@supabase/supabase-js@2");
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

    const { firstName, lastName, email } = await req.json();
    console.log(`New signup: ${firstName} ${lastName}, ${email}`);
    const info = await sendSignupEmail(firstName, lastName, email);
    return new Response(
      JSON.stringify({
        success: true,
        messageId: info.messageId,
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
    console.error("Error sending signup email:", error);
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
