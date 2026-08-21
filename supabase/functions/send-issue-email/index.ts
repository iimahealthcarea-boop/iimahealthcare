import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const ADMIN_EMAIL = "iimahealthcarea@gmail.com";
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

    const { type, email, message, profileDetails } = await req.json();
    console.log(`Sending issue email from ${email}: ${message}`);
    const subject = "IIMA Healthcare SIG Directory - User Issue Report";
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
              <div style="display:inline-block;background-color:#fee2e2;color:#b91c1c;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding:6px 12px;border-radius:6px;">
                Issue reported
              </div>

              <h2 style="margin:16px 0 0;color:#0f172a;font-size:22px;font-weight:700;line-height:1.3;">
                A member reported an issue
              </h2>

              <!-- Issue details -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:700;">
                      Issue details
                    </p>
                    <p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.5;word-break:break-all;">
                      <strong style="color:#0f172a;">From:</strong>&nbsp; ${email}
                    </p>
                    <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.5;">
                      <strong style="color:#0f172a;">Type:</strong>&nbsp; ${type}
                    </p>
                    <div style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:6px;padding:14px;color:#475569;font-size:14px;line-height:1.6;">
                      ${String(message).split("\n").join("<br>")}
                    </div>
                  </td>
                </tr>
              </table>

              ${
                profileDetails
                  ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 0;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:700;">
                      Member profile
                    </p>
                    ${profileDetails.first_name ? `<p style="margin:0 0 6px;color:#475569;font-size:14px;line-height:1.5;"><strong style="color:#0f172a;">Name:</strong>&nbsp; ${profileDetails.first_name} ${profileDetails.last_name || ""}</p>` : ""}
                    ${profileDetails.organization ? `<p style="margin:0 0 6px;color:#475569;font-size:14px;line-height:1.5;"><strong style="color:#0f172a;">Organization:</strong>&nbsp; ${profileDetails.organization}</p>` : ""}
                    ${profileDetails.position ? `<p style="margin:0 0 6px;color:#475569;font-size:14px;line-height:1.5;"><strong style="color:#0f172a;">Position:</strong>&nbsp; ${profileDetails.position}</p>` : ""}
                    ${profileDetails.phone ? `<p style="margin:0 0 6px;color:#475569;font-size:14px;line-height:1.5;"><strong style="color:#0f172a;">Phone:</strong>&nbsp; ${profileDetails.phone}</p>` : ""}
                    ${profileDetails.program ? `<p style="margin:0 0 6px;color:#475569;font-size:14px;line-height:1.5;"><strong style="color:#0f172a;">Program:</strong>&nbsp; ${profileDetails.program}</p>` : ""}
                    ${profileDetails.graduation_year ? `<p style="margin:0;color:#475569;font-size:14px;line-height:1.5;"><strong style="color:#0f172a;">Graduation year:</strong>&nbsp; ${profileDetails.graduation_year}</p>` : ""}
                  </td>
                </tr>
              </table>`
                  : ""
              }

              <!-- Action -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 0;background-color:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:8px;">
                <tr>
                  <td style="padding:18px 24px;">
                    <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;">
                      <strong>Action required:</strong> please review and reply to the member at
                      <a href="mailto:${email}" style="color:#b45309;word-break:break-all;">${email}</a>.
                    </p>
                  </td>
                </tr>
              </table>
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
    const emailResponse = await transporter.sendMail({
      from: `"IIMA Healthcare SIG Directory" <${SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject: "New Issue Reported by User",
      html: htmlContent,
    });
    console.log("Issue email sent successfully:", emailResponse);
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
    console.error("Error in send-issue-email function:", error);
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
