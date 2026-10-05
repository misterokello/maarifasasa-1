import { supabase } from "@/integrations/supabase/client";

export type EmailType = 
  | 'payment_confirmation'
  | 'payment_failed'
  | 'welcome'
  | 'password_reset'
  | 'admin_notification'
  | 'custom';

interface BaseEmailParams {
  to: string | string[];
}

interface PaymentConfirmationParams extends BaseEmailParams {
  type: 'payment_confirmation';
  data: {
    customerName?: string;
    productName?: string;
    amount: number;
    currency: string;
    paymentMethod?: string;
    reference?: string;
    expressSignInUrl?: string;
    thinkificCourseUrl?: string;
    isNewAccount?: boolean;
  };
}

interface PaymentFailedParams extends BaseEmailParams {
  type: 'payment_failed';
  data: {
    customerName?: string;
    reason?: string;
    retryUrl?: string;
  };
}

interface WelcomeParams extends BaseEmailParams {
  type: 'welcome';
  data: {
    name?: string;
  };
}

interface PasswordResetParams extends BaseEmailParams {
  type: 'password_reset';
  data: {
    resetUrl: string;
  };
}

interface AdminNotificationParams extends BaseEmailParams {
  type: 'admin_notification';
  data: {
    title: string;
    message: string;
    details?: Record<string, any>;
    actionUrl?: string;
  };
}

interface CustomEmailParams extends BaseEmailParams {
  type: 'custom';
  subject: string;
  html: string;
  data?: Record<string, any>;
}

export type SendEmailParams = 
  | PaymentConfirmationParams
  | PaymentFailedParams
  | WelcomeParams
  | PasswordResetParams
  | AdminNotificationParams
  | CustomEmailParams;

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Failed to send email' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error invoking send-email function:', err);
    return { success: false, error: err.message };
  }
}

// Convenience functions for common email types
export const emailService = {
  sendPaymentConfirmation: (
    to: string,
    data: PaymentConfirmationParams['data']
  ) => sendEmail({ type: 'payment_confirmation', to, data }),

  sendPaymentFailed: (
    to: string,
    data: PaymentFailedParams['data']
  ) => sendEmail({ type: 'payment_failed', to, data }),

  sendWelcome: (
    to: string,
    data: WelcomeParams['data']
  ) => sendEmail({ type: 'welcome', to, data }),

  sendPasswordReset: (
    to: string,
    data: PasswordResetParams['data']
  ) => sendEmail({ type: 'password_reset', to, data }),

  sendAdminNotification: (
    to: string | string[],
    data: AdminNotificationParams['data']
  ) => sendEmail({ type: 'admin_notification', to, data }),

  sendCustom: (
    to: string | string[],
    subject: string,
    html: string,
    data?: Record<string, any>
  ) => sendEmail({ type: 'custom', to, subject, html, data }),
};
