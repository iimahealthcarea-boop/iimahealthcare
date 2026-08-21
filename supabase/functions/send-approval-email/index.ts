import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "";
const SMTP_APP_PASSWORD = Deno.env.get("SMTP_PASSOWRD") ?? "";
const handler = async (req) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_APP_PASSWORD,
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
      subject = "You're approved — welcome to the IIMA Healthcare SIG Directory";
      htmlContent = `
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
                <div style="display:inline-block;background-color:#dcfce7;color:#15803d;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding:6px 12px;border-radius:6px;">
                  Approved
                </div>

                <h2 style="margin:16px 0 0;color:#0f172a;font-size:22px;font-weight:700;line-height:1.3;">
                  Your membership has been approved
                </h2>

                <p style="margin:16px 0 0;color:#475569;font-size:15px;line-height:1.6;">
                  Dear ${name},
                </p>

                <p style="margin:12px 0 0;color:#475569;font-size:15px;line-height:1.6;">
                  Your registration for the IIMA Healthcare SIG Directory has been approved. You now have full access to the member directory.
                </p>

                <!-- What you can do -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:700;">
                        What you can do now
                      </p>
                      <p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.5;">
                        &bull;&nbsp; Search the alumni directory by organization, skills and interests
                      </p>
                      <p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.5;">
                        &bull;&nbsp; Build your personal network of saved members
                      </p>
                      <p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.5;">
                        &bull;&nbsp; Keep your own profile up to date
                      </p>
                      <p style="margin:0;color:#475569;font-size:14px;line-height:1.5;">
                        &bull;&nbsp; Get notified about upcoming SIG events
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
                  <tr>
                    <td style="background-color:#1d4ed8;border-radius:8px;">
                      <a href="${siteUrl}"
                         style="display:inline-block;padding:13px 30px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                        Open the Directory
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:24px 0 0;color:#64748b;font-size:14px;line-height:1.6;">
                  If you have any questions, just reply to this email and our team will help.
                </p>

                <p style="margin:20px 0 0;color:#475569;font-size:15px;line-height:1.6;">
                  Warm regards,<br>
                  <strong style="color:#0f172a;">The IIMA Healthcare SIG Directory Team</strong>
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
    } else {
      subject =
        "Action needed: please update your IIMA Healthcare SIG Directory application";
      htmlContent = `
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
                <div style="display:inline-block;background-color:#fef3c7;color:#b45309;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding:6px 12px;border-radius:6px;">
                  Action needed
                </div>

                <h2 style="margin:16px 0 0;color:#0f172a;font-size:22px;font-weight:700;line-height:1.3;">
                  Your application needs a few changes
                </h2>

                <p style="margin:16px 0 0;color:#475569;font-size:15px;line-height:1.6;">
                  Dear ${name},
                </p>

                <p style="margin:12px 0 0;color:#475569;font-size:15px;line-height:1.6;">
                  Thank you for applying to the IIMA Healthcare SIG Directory. Our review team looked at your submission and needs a few details updated before your membership can be approved.
                </p>

                ${
                  reason
                    ? `
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;background-color:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:8px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="margin:0 0 8px;color:#92400e;font-size:14px;font-weight:700;">
                        Feedback from the review team
                      </p>
                      <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;white-space:pre-wrap;">${reason}</p>
                    </td>
                  </tr>
                </table>`
                    : `
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;background-color:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:8px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;">
                        Please double-check all required fields &mdash; name, contact details, program, graduation year, current organization, LinkedIn and bio &mdash; then resubmit.
                      </p>
                    </td>
                  </tr>
                </table>`
                }

                <p style="margin:28px 0 12px;color:#0f172a;font-size:14px;font-weight:700;">
                  What happens next
                </p>
                <p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.5;">
                  1.&nbsp; Open your application using the button below.
                </p>
                <p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.5;">
                  2.&nbsp; Update the sections mentioned above.
                </p>
                <p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.5;">
                  3.&nbsp; Submit &mdash; it returns to the review queue automatically.
                </p>
                <p style="margin:0;color:#475569;font-size:14px;line-height:1.5;">
                  4.&nbsp; We'll email you as soon as the team responds.
                </p>

                <!-- CTA -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
                  <tr>
                    <td style="background-color:#1d4ed8;border-radius:8px;">
                      <a href="${resubmitUrl}"
                         style="display:inline-block;padding:13px 30px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                        Update &amp; Resubmit
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;">
                  Or paste this link into your browser:<br>
                  <a href="${resubmitUrl}" style="color:#1d4ed8;">${resubmitUrl}</a>
                </p>

                <p style="margin:24px 0 0;color:#64748b;font-size:14px;line-height:1.6;">
                  If you think this was a mistake or need help, just reply to this email.
                </p>

                <p style="margin:20px 0 0;color:#475569;font-size:15px;line-height:1.6;">
                  Warm regards,<br>
                  <strong style="color:#0f172a;">The IIMA Healthcare SIG Directory Team</strong>
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
    }
    const emailResponse = await transporter.sendMail({
      from: `"IIMA Healthcare SIG Directory" <${SMTP_USER}>`,
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
