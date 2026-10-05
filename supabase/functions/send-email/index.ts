import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email type definitions
const EmailTypes = {
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  PAYMENT_FAILED: 'payment_failed',
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  ADMIN_NOTIFICATION: 'admin_notification',
  CUSTOM: 'custom',
} as const

// Validation schema for email requests
const EmailRequestSchema = z.object({
  type: z.enum([
    EmailTypes.PAYMENT_CONFIRMATION,
    EmailTypes.PAYMENT_FAILED,
    EmailTypes.WELCOME,
    EmailTypes.PASSWORD_RESET,
    EmailTypes.ADMIN_NOTIFICATION,
    EmailTypes.CUSTOM,
  ]),
  to: z.string().email().or(z.array(z.string().email())),
  data: z.record(z.any()).optional(),
  // For custom emails
  subject: z.string().optional(),
  html: z.string().optional(),
  content: z.string().optional(), // Plain text content that will be wrapped in HTML
  recipientName: z.string().optional(),
})

// HTML escape function to prevent XSS attacks
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// Format currency
function formatCurrency(amount: number, currency: string): string {
  if (currency === 'UGX') {
    return `UGX ${amount.toLocaleString()}`
  }
  return `$${amount.toFixed(2)}`
}

// Email templates
const templates = {
  [EmailTypes.PAYMENT_CONFIRMATION]: (data: Record<string, any>) => ({
    subject: `🎉 You're In! Welcome to ${escapeHtml(data.productName || 'Maarifasasa')}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <img src="https://maarifasasa.lovable.app/lovable-uploads/ae09d59b-a9af-4c02-b3eb-0cbb88aa748a.png" alt="Maarifasasa" style="height: 40px; margin-bottom: 15px;" />
          <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700;">Payment Confirmed! ✓</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your learning journey starts now</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <p style="font-size: 17px; margin-top: 0;">Hi <strong>${escapeHtml(data.customerName || 'there')}</strong>,</p>
          <p style="color: #555;">Thank you for your payment! Your transaction has been successfully processed and you're now enrolled in <strong>${escapeHtml(data.productName || 'your course')}</strong>.</p>
          
          <!-- Course Access Section -->
          ${data.expressSignInUrl ? `
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%); padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center;">
            <h3 style="color: #FF6B35; margin: 0 0 10px 0; font-size: 18px;">🚀 Ready to Start Learning?</h3>
            <p style="color: rgba(255,255,255,0.85); margin: 0 0 20px 0; font-size: 14px;">Click below to access your course instantly</p>
            <a href="${escapeHtml(data.expressSignInUrl)}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Access Your Course →</a>
            ${data.thinkificCourseUrl ? `
            <p style="color: rgba(255,255,255,0.6); margin: 15px 0 0 0; font-size: 12px;">Or go directly to: <a href="${escapeHtml(data.thinkificCourseUrl)}" style="color: #FF8C42;">Course Page</a></p>
            ` : ''}
          </div>
          ` : ''}
          
          <!-- New Account Notice -->
          ${data.isNewAccount ? `
          <div style="background: #FFF8F5; padding: 18px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B35;">
            <h4 style="color: #1a1a2e; margin: 0 0 8px 0; font-size: 15px;">📧 New Account Created</h4>
            <p style="color: #555; margin: 0; font-size: 14px;">We've sent you a welcome email to set up your account access. Please check your inbox.</p>
            <p style="color: #777; margin: 10px 0 0 0; font-size: 13px;">💡 <strong>Tip:</strong> You can also sign in with Google using this email address for quick access.</p>
          </div>
          ` : ''}
          
          <!-- Order Details -->
          <div style="background: #FAFAFA; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1a1a2e; font-size: 16px; border-bottom: 2px solid #FF6B35; padding-bottom: 8px; display: inline-block;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; color: #777; font-size: 14px;">Product</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; color: #1a1a2e; font-weight: 600; text-align: right; font-size: 14px;">${escapeHtml(data.productName || 'N/A')}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; color: #777; font-size: 14px;">Amount Paid</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; color: #1a1a2e; font-weight: 600; text-align: right; font-size: 14px;">${formatCurrency(data.amount || 0, data.currency || 'USD')}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; color: #777; font-size: 14px;">Payment Method</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; color: #1a1a2e; text-align: right; font-size: 14px;">${escapeHtml(data.paymentMethod || 'N/A')}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #777; font-size: 14px;">Reference</td>
                <td style="padding: 10px 0; color: #1a1a2e; text-align: right; font-size: 14px; font-family: monospace;">${escapeHtml(data.reference || 'N/A')}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #555; font-size: 14px;">Questions? Reply to this email or reach us at <a href="mailto:support@maarifasasa.com" style="color: #FF6B35;">support@maarifasasa.com</a></p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="margin: 0; color: #1a1a2e; font-size: 15px;">
              Welcome to the journey! 🌍<br>
              <strong style="color: #FF6B35;">The Maarifasasa Team</strong>
            </p>
            <p style="color: #888; font-size: 12px; margin: 10px 0 0 0; font-style: italic;">Knowledge Now. Opportunity Everywhere.</p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 25px 20px; color: #888; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Maarifasasa. All rights reserved.</p>
          <p style="margin: 8px 0 0 0;">Unlocking 1 million earning opportunities for young Africans by 2030</p>
        </div>
      </body>
      </html>
    `,
  }),

  [EmailTypes.PAYMENT_FAILED]: (data: Record<string, any>) => ({
    subject: `Payment Failed - Action Required`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Payment Failed</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="font-size: 16px;">Hi ${escapeHtml(data.customerName || 'there')},</p>
          <p>Unfortunately, your payment could not be processed.</p>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <strong>Reason:</strong> ${escapeHtml(data.reason || 'Payment was declined')}
          </div>
          
          <p>Please try again or use a different payment method. If the problem persists, contact our support team.</p>
          
          <a href="${escapeHtml(data.retryUrl || 'https://maarifasasa.lovable.app/checkout')}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Try Again</a>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Maarifasasa Team</strong>
          </p>
        </div>
      </body>
      </html>
    `,
  }),

  [EmailTypes.WELCOME]: (data: Record<string, any>) => ({
    subject: `Welcome to Maarifasasa! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Maarifasasa! 🎉</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="font-size: 16px;">Hi ${escapeHtml(data.name || 'there')},</p>
          <p>We're thrilled to have you join our learning community!</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
            <h3 style="margin-top: 0; color: #667eea;">Get Started</h3>
            <ul style="padding-left: 20px;">
              <li>Explore our courses and programs</li>
              <li>Set up your learning profile</li>
              <li>Join our community of learners</li>
            </ul>
          </div>
          
          <a href="https://maarifasasa.lovable.app/courses" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Browse Courses</a>
          
          <p style="margin-top: 30px;">
            Happy learning!<br>
            <strong>The Maarifasasa Team</strong>
          </p>
        </div>
      </body>
      </html>
    `,
  }),

  [EmailTypes.PASSWORD_RESET]: (data: Record<string, any>) => ({
    subject: `Reset Your Password`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          
          <a href="${escapeHtml(data.resetUrl || '#')}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
          
          <p style="color: #888; font-size: 14px;">If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Maarifasasa Team</strong>
          </p>
        </div>
      </body>
      </html>
    `,
  }),

  [EmailTypes.ADMIN_NOTIFICATION]: (data: Record<string, any>) => ({
    subject: `[Admin] ${escapeHtml(data.title || 'New Notification')}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a1a2e; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Admin Notification</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #1a1a2e; margin-top: 0;">${escapeHtml(data.title || 'Notification')}</h2>
          <p>${escapeHtml(data.message || '')}</p>
          
          ${data.details ? `
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
            <pre style="margin: 0; white-space: pre-wrap; font-size: 12px;">${escapeHtml(JSON.stringify(data.details, null, 2))}</pre>
          </div>
          ` : ''}
          
          ${data.actionUrl ? `
          <a href="${escapeHtml(data.actionUrl)}" style="display: inline-block; background: #1a1a2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Details</a>
          ` : ''}
          
          <p style="margin-top: 30px; color: #888; font-size: 12px;">
            This is an automated admin notification from Maarifasasa.
          </p>
        </div>
      </body>
      </html>
    `,
  }),

  [EmailTypes.CUSTOM]: (data: Record<string, any>) => {
    // If html is provided, use it directly; otherwise, wrap content in a template
    if (data.html) {
      return {
        subject: data.subject || 'Message from Maarifasasa',
        html: data.html,
      }
    }

    // Wrap plain text content in a nice HTML template
    const formattedContent = (data.content || 'No content provided')
      .split('\n')
      .map((line: string) => `<p style="margin: 0 0 10px 0;">${escapeHtml(line)}</p>`)
      .join('')

    return {
      subject: data.subject || 'Message from Maarifasasa',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <img src="https://maarifasasa.lovable.app/lovable-uploads/ae09d59b-a9af-4c02-b3eb-0cbb88aa748a.png" alt="Maarifasasa" style="height: 40px; margin-bottom: 15px;" />
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Message from Maarifasasa</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            ${data.recipientName ? `<p style="font-size: 17px; margin-top: 0;">Hi <strong>${escapeHtml(data.recipientName)}</strong>,</p>` : ''}
            
            <div style="color: #555;">
              ${formattedContent}
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #1a1a2e; font-size: 15px;">
                Best regards,<br>
                <strong style="color: #FF6B35;">The Maarifasasa Team</strong>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 25px 20px; color: #888; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Maarifasasa. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    }
  },
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Require an authenticated admin caller. The send-email function can emit
    // arbitrary HTML via the CUSTOM type from a verified sending domain, so we
    // refuse unauthenticated callers to prevent it from being used as an open
    // phishing relay.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userErr } = await authClient.auth.getUser(token)
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }
    const { data: isAdmin } = await authClient.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    })
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const rawData = await req.json()
    
    // Validate request
    let emailRequest
    try {
      emailRequest = EmailRequestSchema.parse(rawData)
    } catch (validationError) {
      console.error("Validation error:", validationError)
      return new Response(
        JSON.stringify({ 
          error: "Invalid request data", 
          details: validationError instanceof z.ZodError ? validationError.errors : "Validation failed"
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      )
    }

    const { type, to, data = {} } = emailRequest
    
    // Get template
    const template = templates[type]
    if (!template) {
      return new Response(
        JSON.stringify({ error: "Unknown email type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    // For custom emails, pass all relevant fields from request
    const templateData = type === EmailTypes.CUSTOM 
      ? { ...data, subject: emailRequest.subject, html: emailRequest.html, content: (emailRequest as any).content, recipientName: (emailRequest as any).recipientName }
      : data

    const { subject, html } = template(templateData)
    const recipients = Array.isArray(to) ? to : [to]

    console.log(`Sending ${type} email to:`, recipients)

    // Add finance@maarifasasa.com as CC for payment confirmation emails
    const ccRecipients = type === EmailTypes.PAYMENT_CONFIRMATION 
      ? ['finance@maarifasasa.com'] 
      : undefined

    const { data: emailResponse, error } = await resend.emails.send({
      from: 'Maarifasasa <noreply@maarifasasa.com>',
      to: recipients,
      cc: ccRecipients,
      subject,
      html,
    })

    if (error) {
      console.error("Error sending email:", error)
      throw error
    }

    console.log("Email sent successfully:", emailResponse)

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    )
  } catch (error: any) {
    console.error("Error in send-email function:", error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    )
  }
})
