import { NextResponse } from 'next/server';
import {
  sendSMS,
  sendBookingConfirmationSMS,
  sendBookingReminderSMS,
  checkSMSService,
  smsTemplates,
} from '@/lib/sms/twilio';

// Send SMS endpoint
export async function POST(request: Request) {
  try {
    const { action, to, message, data, hoursBefore } = await request.json();

    // Check SMS service health
    const health = checkSMSService();
    if (!health.configured) {
      return NextResponse.json(
        {
          error: 'SMS service not configured',
          details: health.message,
        },
        { status: 503 }
      );
    }

    switch (action) {
      case 'test':
        // Send a test SMS
        const testMessage =
          message ||
          '🧪 SalonBooker SMS Test\n\nDit is een test bericht.\nSMS werkt! ✅';
        const testResult = await sendSMS(
          to || process.env.TEST_PHONE || '+31612345678',
          testMessage
        );
        return NextResponse.json(testResult);

      case 'booking-confirmation':
        // Send booking confirmation SMS
        if (!to || !data?.service_name || !data?.booking_date || !data?.booking_time) {
          return NextResponse.json(
            {
              error:
                'Missing required fields: to, data.service_name, data.booking_date, data.booking_time',
            },
            { status: 400 }
          );
        }
        const confirmResult = await sendBookingConfirmationSMS(to, data);
        return NextResponse.json(confirmResult);

      case 'booking-reminder':
        // Send booking reminder SMS
        if (!to || !data?.service_name || !data?.booking_date || !data?.booking_time) {
          return NextResponse.json(
            {
              error:
                'Missing required fields: to, data.service_name, data.booking_date, data.booking_time',
            },
            { status: 400 }
          );
        }
        const reminderResult = await sendBookingReminderSMS(
          to,
          data,
          hoursBefore || 24
        );
        return NextResponse.json(reminderResult);

      case 'booking-cancelled':
        // Send cancellation SMS
        if (!to || !data?.service_name || !data?.booking_date || !data?.booking_time) {
          return NextResponse.json(
            {
              error:
                'Missing required fields: to, data.service_name, data.booking_date, data.booking_time',
            },
            { status: 400 }
          );
        }
        const cancelMessage = smsTemplates.bookingCancelled({
          serviceName: data.service_name,
          date: data.booking_date,
          time: data.booking_time,
        });
        const cancelResult = await sendSMS(to, cancelMessage);
        return NextResponse.json(cancelResult);

      case 'welcome':
        // Send welcome SMS
        if (!to || !data?.name) {
          return NextResponse.json(
            { error: 'Missing required fields: to, data.name' },
            { status: 400 }
          );
        }
        const welcomeMessage = smsTemplates.welcome({
          name: data.name,
          salonName: data.salonName,
        });
        const welcomeResult = await sendSMS(to, welcomeMessage);
        return NextResponse.json(welcomeResult);

      default:
        return NextResponse.json(
          {
            error:
              'Unknown action. Use: test, booking-confirmation, booking-reminder, booking-cancelled, welcome',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send SMS',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const health = checkSMSService();
  return NextResponse.json(health);
}
