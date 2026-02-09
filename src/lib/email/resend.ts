import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates in Dutch
const emailTemplates = {
  signupConfirmation: (data: { email: string; confirmationUrl: string; name?: string }) => ({
    subject: `Bevestig je aanmelding bij SalonBooker`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bevestig je aanmelding</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background: #f3f4f6; }
            .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: #0f172a; color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .content h2 { color: #0f172a; margin-top: 0; }
            .button { display: inline-block; background: #0f172a; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .button:hover { background: #1e293b; }
            .link-box { background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 13px; word-break: break-all; margin: 20px 0; }
            .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
            .highlight { background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ SalonBooker</h1>
            </div>
            <div class="content">
              <h2>Welkom bij SalonBooker!</h2>
              <p>Beste ${data.name || 'nieuwe gebruiker'},</p>
              <p>Bedankt voor je aanmelding. Je bent bijna klaar! Klik op de onderstaande knop om je emailadres te bevestigen:</p>
              
              <div style="text-align: center;">
                <a href="${data.confirmationUrl}" class="button">Email bevestigen</a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">Of kopieer deze link naar je browser:</p>
              <div class="link-box">${data.confirmationUrl}</div>
              
              <div class="highlight">
                <strong>⏰ Let op:</strong> Deze link verloopt over 24 uur.
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">Als je je niet hebt aangemeld bij SalonBooker, kun je deze email negeren.</p>
            </div>
            <div class="footer">
              <p><strong>SalonBooker</strong></p>
              <p>Professionele software voor jouw salon</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
  
  passwordReset: (data: { email: string; resetUrl: string; name?: string }) => ({
    subject: `Wachtwoord reset aanvraag - SalonBooker`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Wachtwoord reset</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background: #f3f4f6; }
            .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: #dc2626; color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .button:hover { background: #b91c1c; }
            .link-box { background: #fef2f2; padding: 15px; border-radius: 8px; font-size: 13px; word-break: break-all; margin: 20px 0; border: 1px solid #fecaca; }
            .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
            .warning { background: #fff7ed; padding: 15px; border-radius: 8px; border-left: 4px solid #f97316; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Wachtwoord Reset</h1>
            </div>
            <div class="content">
              <h2>Beste ${data.name || 'gebruiker'},</h2>
              <p>Je hebt een wachtwoord reset aangevraagd voor je SalonBooker account. Klik op de onderstaande knop om een nieuw wachtwoord in te stellen:</p>
              
              <div style="text-align: center;">
                <a href="${data.resetUrl}" class="button">Wachtwoord resetten</a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">Of kopieer deze link naar je browser:</p>
              <div class="link-box">${data.resetUrl}</div>
              
              <div class="warning">
                <strong>⚠️ Belangrijk:</strong> Deze link verloopt over 1 uur om veiligheidsredenen.
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">Als je geen reset hebt aangevraagd, kun je deze email negeren. Je wachtwoord blijft dan ongewijzigd.</p>
            </div>
            <div class="footer">
              <p><strong>SalonBooker</strong></p>
              <p>Veilig beheren van je salon</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
  
  welcomeEmail: (data: { name: string; loginUrl?: string }) => ({
    subject: `Welkom bij SalonBooker - Je account is actief!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welkom bij SalonBooker</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background: #f3f4f6; }
            .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: #0f172a; color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .features { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .features ul { margin: 0; padding-left: 20px; }
            .features li { margin: 10px 0; }
            .button { display: inline-block; background: #0f172a; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welkom bij SalonBooker!</h1>
            </div>
            <div class="content">
              <h2>Beste ${data.name},</h2>
              <p>Geweldig nieuws! Je account is nu volledig geactiveerd. Je kunt nu direct aan de slag met het beheren van je salon.</p>
              
              <div style="text-align: center;">
                <a href="${data.loginUrl || 'https://salonbooker-web.vercel.app'}" class="button">Inloggen bij SalonBooker</a>
              </div>
              
              <div class="features">
                <h3 style="margin-top: 0;">Wat je kunt doen:</h3>
                <ul>
                  <li>📅 Afspraken beheren in de agenda</li>
                  <li>👥 Klantenbestand opbouwen</li>
                  <li>💇 Diensten en prijzen configureren</li>
                  <li>📊 Rapporten en inzichten bekijken</li>
                  <li>👤 Medewerkers toevoegen</li>
                </ul>
              </div>
              
              <p>Heb je vragen? Stuur ons een bericht en we helpen je graag!</p>
            </div>
            <div class="footer">
              <p><strong>SalonBooker</strong></p>
              <p>Professionele salon software</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

export async function sendEmail({
  to,
  template,
  data,
  from = process.env.EMAIL_FROM || 'onboarding@resend.dev',
}: {
  to: string;
  template: keyof typeof emailTemplates;
  data: any;
  from?: string;
}) {
  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return {
      success: false,
      error: 'Email service not configured - RESEND_API_KEY missing',
      mock: true,
    };
  }

  try {
    const templateFn = emailTemplates[template];
    if (!templateFn) {
      throw new Error(`Unknown email template: ${template}`);
    }

    const { subject, html } = templateFn(data);

    const { data: responseData, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend email error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ Email sent successfully:', responseData?.id);
    return {
      success: true,
      messageId: responseData?.id,
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Health check function
export async function checkEmailService() {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    return {
      configured: false,
      status: 'not_configured',
      message: 'RESEND_API_KEY not set',
    };
  }

  // Basic validation - Resend keys start with 're_'
  if (!apiKey.startsWith('re_')) {
    return {
      configured: false,
      status: 'invalid_key',
      message: 'RESEND_API_KEY format is invalid (should start with re_)',
    };
  }

  return {
    configured: true,
    status: 'ready',
    message: 'Email service is configured',
  };
}
