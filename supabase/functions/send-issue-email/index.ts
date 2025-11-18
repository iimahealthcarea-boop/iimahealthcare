import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const ADMIN_EMAIL = "vikash.patwari@gmail.com";
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
    const { type, email, message, profileDetails } = await req.json();
    console.log(`Sending issue email from ${email}: ${message}`);
    const subject = "IIM-AMS Support Request - User Issue Report";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          IIM-AMS Alumni Management System
        </h1>
        
        <h2 style="color: #dc2626;">Support Request - User Issue Report</h2>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Issue Details</h3>
          <p><strong>User Email:</strong> ${email}</p>
          <p><strong>Issue Type:</strong> ${type}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: white; border: 1px solid #d1d5db; border-radius: 4px; padding: 12px; margin: 8px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>

        ${profileDetails ? `
          <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #0c4a6e; margin-top: 0;">User Profile Information</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              ${profileDetails.first_name ? `<p><strong>Name:</strong> ${profileDetails.first_name} ${profileDetails.last_name || ''}</p>` : ''}
              ${profileDetails.organization ? `<p><strong>Organization:</strong> ${profileDetails.organization}</p>` : ''}
              ${profileDetails.position ? `<p><strong>Position:</strong> ${profileDetails.position}</p>` : ''}
              ${profileDetails.phone ? `<p><strong>Phone:</strong> ${profileDetails.phone}</p>` : ''}
              ${profileDetails.program ? `<p><strong>Program:</strong> ${profileDetails.program}</p>` : ''}
              ${profileDetails.graduation_year ? `<p><strong>Graduation Year:</strong> ${profileDetails.graduation_year}</p>` : ''}
            </div>
          </div>
        ` : ''}
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="color: #92400e; margin-top: 0;">Action Required</h3>
          <p style="margin-bottom: 0;">Please review this issue and respond to the user at <strong>${email}</strong> as soon as possible.</p>
        </div>
        
        <p>This issue was automatically generated from the IIM-AMS Alumni Management System.</p>
        
        <p>Best regards,<br>
        IIM-AMS System</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
          This is an automated message from IIM-AMS Alumni Management System
        </p>
      </div>
    `;
    const emailResponse = await transporter.sendMail({
      from: `"IIM-AMS Issue Reporter" <ansh.kush.2410@gmail.com>`,
      to: ADMIN_EMAIL,
      subject: "New Issue Reported by User",
      html: htmlContent
    });
    console.log("Issue email sent successfully:", emailResponse);
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
    console.error("Error in send-issue-email function:", error);
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
