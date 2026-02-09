import { NextResponse } from 'next/server';
import { sendEmail, checkEmailService } from '@/lib/email/resend';

// Test email endpoint
export async function POST(request: Request) {
  try {
    const { action, to, template, data } = await request.json();

    // Check email service health
    const health = await checkEmailService();
    if (!health.configured) {
      return NextResponse.json(
        { 
          error: 'Email service not configured',
          details: health.message 
        },
        { status: 503 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'test':
        // Send a test email
        const result = await sendEmail({
          to: to || process.env.TEST_EMAIL || 'test@example.com',
          template: template || 'welcomeEmail',
          data: data || { name: 'Test Gebruiker', loginUrl: 'https://salonbooker-web.vercel.app' },
        });
        return NextResponse.json(result);

      case 'signup':
        // Send signup confirmation email
        if (!to || !data?.confirmationUrl) {
          return NextResponse.json(
            { error: 'Missing required fields: to, data.confirmationUrl' },
            { status: 400 }
          );
        }
        const signupResult = await sendEmail({
          to,
          template: 'signupConfirmation',
          data: {
            email: to,
            name: data.name,
            confirmationUrl: data.confirmationUrl,
          },
        });
        return NextResponse.json(signupResult);

      case 'password-reset':
        // Send password reset email
        if (!to || !data?.resetUrl) {
          return NextResponse.json(
            { error: 'Missing required fields: to, data.resetUrl' },
            { status: 400 }
          );
        }
        const resetResult = await sendEmail({
          to,
          template: 'passwordReset',
          data: {
            email: to,
            name: data.name,
            resetUrl: data.resetUrl,
          },
        });
        return NextResponse.json(resetResult);

      case 'welcome':
        // Send welcome email after confirmation
        if (!to || !data?.name) {
          return NextResponse.json(
            { error: 'Missing required fields: to, data.name' },
            { status: 400 }
          );
        }
        const welcomeResult = await sendEmail({
          to,
          template: 'welcomeEmail',
          data: {
            name: data.name,
            loginUrl: data.loginUrl || 'https://salonbooker-web.vercel.app',
          },
        });
        return NextResponse.json(welcomeResult);

      default:
        return NextResponse.json(
          { error: 'Unknown action. Use: test, signup, password-reset, welcome' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const health = await checkEmailService();
  return NextResponse.json(health);
}
