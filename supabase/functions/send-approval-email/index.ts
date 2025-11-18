import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const handler = async (req)=>{
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "iimahealthcarea@gmail.com",
      pass: "dbnl ykcv mygi miel"
    }
  });
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { email, name, status, reason, profile } = await req.json();
    console.log(`Sending ${status} email to ${email} for user ${name}`);
    let subject;
    let htmlContent;
    if (status === 'approved') {
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
      subject = "IIM-AMS Registration Update Required";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            IIM-AMS Alumni Management System
          </h1>
          
          <h2 style="color: #dc2626;">Registration Requires Update</h2>
          
          <p>Dear ${name},</p>
          
          <p>Thank you for your interest in joining the IIM-AMS alumni community.</p>
          
          <p>After reviewing your registration, we need you to update some information before we can approve your account.</p>
          
          ${reason ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin-top: 0;">Reason for Update Request:</h3>
              <p style="margin-bottom: 0;">${reason}</p>
            </div>
          ` : ''}
          
          <p>Please log in to your account and update your registration information accordingly. Once you've made the necessary changes, your registration will be reviewed again.</p>
          
          <p>If you have any questions about the required updates, please contact our support team for assistance.</p>
          
          <p>Thank you for your understanding.</p>
          
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
      from: `"IIM-AMS Admin Notifier" <aiimahealthcarea@gmail.com>`,
      to: [
        email
      ],
      subject: subject,
      html: htmlContent
    });
  
    console.log("Email sent successfully:", emailResponse);
    return new Response(JSON.stringify({
      success: true,
      emailResponse
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Error in send-approval-email function:", error);
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
