// Webhook Service for SalonBooker
// Handles webhook delivery, retries, and signature verification

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export interface WebhookPayload {
  event: string
  timestamp: string
  data: unknown
}

export interface WebhookDelivery {
  id: string
  webhook_id: string
  event: string
  payload: WebhookPayload
  response_status?: number
  response_body?: string
  error_message?: string
  attempt_count: number
  delivered_at?: string
  created_at: string
}

// Generate HMAC signature for webhook payload
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// Send webhook to subscriber
export async function sendWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string
): Promise<{ success: boolean; status?: number; body?: string; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload)
    const signature = generateWebhookSignature(payloadString, secret)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
        'User-Agent': 'SalonBooker-Webhook/1.0'
      },
      body: payloadString,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    const responseBody = await response.text()

    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      body: responseBody
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Process pending webhook deliveries
export async function processWebhookDeliveries(
  batchSize: number = 10
): Promise<{ processed: number; successful: number; failed: number }> {
  const supabase = createClient()
  const results = { processed: 0, successful: 0, failed: 0 }

  try {
    // Get pending deliveries with webhook details
    const { data: deliveries, error } = await supabase
      .from('webhook_deliveries')
      .select(`
        id,
        webhook_id,
        event,
        payload,
        attempt_count,
        webhooks:webhook_id (url, secret)
      `)
      .is('delivered_at', null)
      .lt('attempt_count', 5) // Max 5 attempts
      .order('created_at', { ascending: true })
      .limit(batchSize)

    if (error || !deliveries || deliveries.length === 0) {
      return results
    }

    for (const delivery of deliveries) {
      results.processed++
      
      const webhook = delivery.webhooks as { url: string; secret: string }
      
      if (!webhook?.url || !webhook?.secret) {
        // Mark as failed if webhook config is missing
        await supabase
          .from('webhook_deliveries')
          .update({
            error_message: 'Webhook configuration missing',
            attempt_count: delivery.attempt_count + 1
          })
          .eq('id', delivery.id)
        results.failed++
        continue
      }

      // Send the webhook
      const result = await sendWebhook(
        webhook.url,
        delivery.payload as WebhookPayload,
        webhook.secret
      )

      if (result.success) {
        // Mark as delivered
        await supabase
          .from('webhook_deliveries')
          .update({
            response_status: result.status,
            response_body: result.body,
            delivered_at: new Date().toISOString(),
            attempt_count: delivery.attempt_count + 1
          })
          .eq('id', delivery.id)
        results.successful++
      } else {
        // Update with error, will be retried
        await supabase
          .from('webhook_deliveries')
          .update({
            response_status: result.status,
            error_message: result.error,
            attempt_count: delivery.attempt_count + 1
          })
          .eq('id', delivery.id)
        results.failed++
      }

      // Small delay between requests to avoid overwhelming receivers
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return results
  } catch (error) {
    console.error('Error processing webhook deliveries:', error)
    return results
  }
}

// Create a new webhook subscription
export async function createWebhook(
  salonId: string,
  name: string,
  url: string,
  events: string[],
  secret?: string
): Promise<{ success: boolean; webhook?: { id: string; secret: string }; error?: string }> {
  const supabase = createClient()

  try {
    // Generate secret if not provided
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex')

    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        salon_id: salonId,
        name,
        url,
        secret: webhookSecret,
        events: events.length > 0 ? events : ['booking.created', 'booking.updated', 'booking.cancelled']
      })
      .select('id, secret')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, webhook: data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Test a webhook by sending a ping event
export async function testWebhook(
  webhookId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { data: webhook, error } = await supabase
      .from('webhooks')
      .select('url, secret')
      .eq('id', webhookId)
      .single()

    if (error || !webhook) {
      return { success: false, error: 'Webhook not found' }
    }

    const pingPayload: WebhookPayload = {
      event: 'ping',
      timestamp: new Date().toISOString(),
      data: { message: 'Webhook test ping' }
    }

    const result = await sendWebhook(webhook.url, pingPayload, webhook.secret)

    return {
      success: result.success,
      error: result.error
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
