
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validation schema for contact form inputs
const ContactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000, "Message must be less than 5000 characters")
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

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse and validate input data
    const rawData = await req.json()
    
    let formData: ContactFormData
    try {
      formData = ContactFormSchema.parse(rawData)
    } catch (validationError) {
      console.error("Validation error:", validationError)
      return new Response(
        JSON.stringify({ 
          error: "Invalid form data", 
          details: validationError instanceof z.ZodError ? validationError.errors : "Validation failed"
        }),
        { 
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      )
    }
    
    console.log("Sending contact form email from:", formData.email)
    
    // Escape all user inputs to prevent XSS
    const safeName = escapeHtml(formData.name)
    const safeEmail = escapeHtml(formData.email)
    const safeSubject = escapeHtml(formData.subject)
    const safeMessage = escapeHtml(formData.message).replace(/\n/g, '<br>')
    
    const { data, error } = await resend.emails.send({
      from: 'Maarifasasa Contact Form <noreply@maarifasasa.com>',
      to: ['info@maarifasasa.com'],
      reply_to: formData.email,
      subject: `Contact Form: ${formData.subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <h3>Message:</h3>
        <p>${safeMessage}</p>
      `,
    })

    if (error) {
      console.error("Error sending email:", error)
      throw error
    }

    console.log("Email sent successfully:", data)

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    )
  } catch (error) {
    console.error("Error in send-contact-email function:", error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    )
  }
})
