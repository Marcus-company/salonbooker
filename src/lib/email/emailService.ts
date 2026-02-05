// Email Service for SalonBooker
// Handles sending emails using various providers

import { 
  bookingConfirmationEmail,
  bookingConfirmedEmail,
  bookingCancelledEmail,
  bookingReminderEmail,
  welcomeEmail,
  type EmailTemplate 
} from './templates/bookingEmails'

export type EmailType = 
  | 'booking_confirmation'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_reminder'
  | 'welcome'

interface EmailData {
  customerName: string
  customerEmail: string
  serviceName?: string
  date?: string
  time?: string
  reason?: string
}

// For now, log emails to console (integrate with SendGrid/Resend later)
export async function sendEmail(
  type: EmailType,
  data: EmailData
): Promise<{ success: boolean; message: string }> {
  try {
    let template: EmailTemplate

    switch (type) {
      case 'booking_confirmation':
        if (!data.serviceName || !data.date || !data.time) {
          throw new Error('Missing required fields for booking confirmation email')
        }
        template = bookingConfirmationEmail(
          data.customerName,
          data.serviceName,
          data.date,
          data.time
        )
        break

      case 'booking_confirmed':
        if (!data.serviceName || !data.date || !data.time) {
          throw new Error('Missing required fields for booking confirmed email')
        }
        template = bookingConfirmedEmail(
          data.customerName,
          data.serviceName,
          data.date,
          data.time
        )
        break

      case 'booking_cancelled':
        if (!data.serviceName || !data.date || !data.time) {
          throw new Error('Missing required fields for booking cancelled email')
        }
        template = bookingCancelledEmail(
          data.customerName,
          data.serviceName,
          data.date,
          data.time,
          'HairsalonX',
          data.reason
        )
        break

      case 'booking_reminder':
        if (!data.serviceName || !data.date || !data.time) {
          throw new Error('Missing required fields for booking reminder email')
        }
        template = bookingReminderEmail(
          data.customerName,
          data.serviceName,
          data.date,
          data.time
        )
        break

      case 'welcome':
        template = welcomeEmail(data.customerName)
        break

      default:
        throw new Error(`Unknown email type: ${type}`)
    }

    // Log the email (replace with actual email provider integration)
    console.log('📧 Email would be sent:', {
      to: data.customerEmail,
      subject: template.subject,
      type
    })

    // TODO: Integrate with email provider (SendGrid, Resend, AWS SES)
    // Example with SendGrid:
    // await sendGridClient.send({
    //   to: data.customerEmail,
    //   from: 'noreply@hairsalonx.nl',
    //   subject: template.subject,
    //   html: template.html,
    //   text: template.text
    // })

    return {
      success: true,
      message: `Email "${template.subject}" queued for ${data.customerEmail}`
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Hook to send email when booking status changes
export async function sendBookingStatusEmail(
  status: 'pending' | 'confirmed' | 'cancelled',
  data: EmailData
): Promise<void> {
  switch (status) {
    case 'pending':
      await sendEmail('booking_confirmation', data)
      break
    case 'confirmed':
      await sendEmail('booking_confirmed', data)
      break
    case 'cancelled':
      await sendEmail('booking_cancelled', data)
      break
  }
}
