import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// Dutch SMS templates
export const smsTemplates = {
  bookingConfirmation: (data: {
    serviceName: string;
    date: string;
    time: string;
    salonName?: string;
  }) =>
    `✅ Bevestigd: ${data.serviceName}\n` +
    `📅 ${data.date} om ${data.time}\n` +
    `📍 ${data.salonName || 'Onze salon'}\n\n` +
    `Tot ziens!`,

  bookingReminder24h: (data: {
    serviceName: string;
    date: string;
    time: string;
  }) =>
    `⏰ Herinnering: Morgen ${data.time}\n` +
    `✂️ ${data.serviceName}\n` +
    `📅 ${data.date}\n\n` +
    `Zie je dan!`,

  bookingReminder1h: (data: {
    serviceName: string;
    time: string;
  }) =>
    `⏰ Over 1 uur: ${data.serviceName}\n` +
    `📅 ${data.time}\n\n` +
    `Tot zo!`,

  bookingCancelled: (data: {
    serviceName: string;
    date: string;
    time: string;
  }) =>
    `❌ Geannuleerd: ${data.serviceName}\n` +
    `📅 Was: ${data.date} ${data.time}\n\n` +
    `Nieuwe afspraak? Bel ons!`,

  welcome: (data: { name: string; salonName?: string }) =>
    `Welkom bij ${data.salonName || 'SalonBooker'}!\n\n` +
    `Je account is actief.\n` +
    `Login: salonbooker-web.vercel.app`,
};

export interface SMSResult {
  success: boolean;
  messageSid?: string;
  error?: string;
  mock?: boolean;
}

export async function sendSMS(
  to: string,
  message: string
): Promise<SMSResult> {
  // Check configuration
  if (!client || !fromNumber) {
    console.error('Twilio not configured');
    return {
      success: false,
      error: 'SMS service not configured - check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER',
      mock: true,
    };
  }

  // Validate phone number format (E.164)
  if (!to.startsWith('+')) {
    return {
      success: false,
      error: 'Phone number must be in E.164 format (e.g., +31612345678)',
    };
  }

  try {
    const response = await client.messages.create({
      body: message,
      from: fromNumber,
      to,
    });

    console.log('✅ SMS sent:', response.sid);
    return {
      success: true,
      messageSid: response.sid,
    };
  } catch (error) {
    console.error('SMS send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendBookingConfirmationSMS(
  phone: string,
  booking: {
    service_name: string;
    booking_date: string;
    booking_time: string;
  },
  salonName?: string
): Promise<SMSResult> {
  const message = smsTemplates.bookingConfirmation({
    serviceName: booking.service_name,
    date: booking.booking_date,
    time: booking.booking_time,
    salonName,
  });

  return sendSMS(phone, message);
}

export async function sendBookingReminderSMS(
  phone: string,
  booking: {
    service_name: string;
    booking_date: string;
    booking_time: string;
  },
  hoursBefore: 24 | 1 = 24
): Promise<SMSResult> {
  const template =
    hoursBefore === 24
      ? smsTemplates.bookingReminder24h
      : smsTemplates.bookingReminder1h;

  const message = template({
    serviceName: booking.service_name,
    date: booking.booking_date,
    time: booking.booking_time,
  });

  return sendSMS(phone, message);
}

export function checkSMSService() {
  const configured = !!(client && fromNumber);

  return {
    configured,
    status: configured ? 'ready' : 'not_configured',
    message: configured
      ? 'SMS service is configured'
      : 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER missing',
  };
}
