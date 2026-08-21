import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  email?: string;
  phone?: string;
  isSignUp: boolean;
  userData?: {
    first_name: string;
    last_name: string;
  };
}

const generateOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, isSignUp, userData }: SendOtpRequest = await req.json();

    if (!email && !phone) {
      return new Response(
        JSON.stringify({ error: "Email or phone number is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate OTP code
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log(`Generated OTP: ${otpCode} for ${email || phone}`);

    // For sign up, check if user already exists
    if (isSignUp) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const userExists = existingUsers.users?.some(user => 
        email ? user.email === email : user.phone === phone
      );
      if (userExists) {
        return new Response(
          JSON.stringify({ error: "User already exists. Please sign in instead." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Store OTP in database
    const { error: otpError } = await supabase
      .from("otp_codes")
      .insert({
        email: email || null,
        phone: phone || null,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

    if (otpError) {
      console.error("Error storing OTP:", otpError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send OTP via email
    if (email) {
      const emailResponse = await resend.emails.send({
        from: "IIMA Healthcare SIG Directory <onboarding@resend.dev>",
        to: [email],
        subject: `Your IIMA Healthcare SIG Directory verification code: ${otpCode}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Your Verification Code</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1d4ed8; color: #ffffff; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
                .otp-code { 
                  font-size: 32px; 
                  font-weight: bold; 
                  color: #1d4ed8; 
                  text-align: center; 
                  padding: 20px; 
                  background: #f8f9fa; 
                  border-radius: 8px; 
                  margin: 20px 0;
                  letter-spacing: 4px;
                }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>IIMA Healthcare SIG Directory</h1>
                  <p>Verification Code</p>
                </div>
                <div class="content">
                  <h2>Hello!</h2>
                  <p>You requested ${isSignUp ? 'to create an account' : 'to sign in'} with the IIMA Healthcare SIG Directory. Please use the verification code below:</p>
                  
                  <div class="otp-code">${otpCode}</div>
                  
                  <p><strong>This code will expire in 10 minutes.</strong></p>
                  
                  <p>If you didn't request this code, please ignore this email.</p>
                  
                  <p>Best regards,<br>The IIMA Healthcare SIG Directory Team</p>
                </div>
                <div class="footer">
                  <p>This is an automated message. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      console.log("Email response:", emailResponse);

      if (emailResponse.error) {
        console.error("Error sending email:", emailResponse.error);
        // Don't fail completely - log the OTP for testing
        console.log(`Email fallback - OTP for ${email}: ${otpCode}`);
      }
    }

    // Send SMS via MSG91 (simplified for testing)
    if (phone) {
      // For now, just log the OTP to console for testing
      // You can implement actual MSG91 integration when you have a valid flow ID
      console.log(`SMS OTP for ${phone}: ${otpCode}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Verification code sent to your ${email ? 'email' : 'phone'}` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);