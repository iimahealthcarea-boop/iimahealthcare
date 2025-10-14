import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
// Hardcoded admin email
const ADMIN_EMAIL = "shubham.kushwaha@mrikal.com";
// Function to send signup email
const sendSignupEmail = async (firstName, lastName, userEmail)=>{
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "ansh.kush.2410@gmail.com",
      pass: "dawr dhmm sxjn enfa" // your app password
    }
  });
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #f9fafb; padding: 40px; border-radius: 10px; border: 1px solid #e5e7eb;">
      <h2 style="color: #1e40af; font-size: 22px; margin-bottom: 20px; text-align: center;">
        New User Signup Pending Approval
      </h2>
      <p style="font-size: 16px; color: #374151;">
        A new user has signed up and is waiting for your approval.
      </p>
      <p style="font-size: 16px; color: #374151;">
        <strong>First Name:</strong> ${firstName} <br>
        <strong>Last Name:</strong> ${lastName} <br>
        <strong>Email:</strong> ${userEmail}
      </p>
      <p style="font-size: 16px; color: #374151;">
        Please log in to the admin panel to review and approve this request.
      </p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #d1d5db;">
      <p style="font-size: 12px; color: #6b7280; text-align: center;">
        This is an automated email from IIM-AMS Alumni Management System
      </p>
    </div>
  `;
  return await transporter.sendMail({
    from: `"IIM-AMS Admin Notifier" <ansh.kush.2410@gmail.com>`,
    to: ADMIN_EMAIL,
    subject: "New User Signup Pending Approval",
    html: htmlContent
  });
};
// Dedicated handler for signup emails
const handler = async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { firstName, lastName, email } = await req.json();
    console.log(`New signup: ${firstName} ${lastName}, ${email}`);
    const info = await sendSignupEmail(firstName, lastName, email);
    return new Response(JSON.stringify({
      success: true,
      messageId: info.messageId
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Error sending signup email:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
};
serve(handler);
