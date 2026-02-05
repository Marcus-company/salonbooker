import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit, withRateLimit } from './rateLimit'
import { NextRequest } from 'next/server'

// Mock NextRequest
function createMockRequest(ip: string = '127.0.0.1', path: string = '/api/test') {
  return {
    ip,
    headers: {
      get: (key: string) => key === 'x-forwarded-for' ? ip : null
    },
    nextUrl: {
      pathname: path
    }
  } as NextRequest
}

describe('rateLimit', () => {
  beforeEach(() => {
    // Clear the rate limit map between tests
    // Note: In a real implementation, we'd need a way to reset the Map
  })

  it('should allow requests within the limit', () => {
    const req = createMockRequest()
    const result = rateLimit(req, { maxRequests: 5, windowMs: 60000 })
    
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
    expect(result.limit).toBe(5)
  })

  it('should return 429 when limit is exceeded', () => {
    const req = createMockRequest()
    const options = { maxRequests: 2, windowMs: 60000 }
    
    // First request
    const result1 = rateLimit(req, options)
    expect(result1.success).toBe(true)
    
    // Second request
    const result2 = rateLimit(req, options)
    expect(result2.success).toBe(true)
    
    // Third request (should be blocked)
    const result3 = rateLimit(req, options)
    expect(result3.success).toBe(false)
    expect(result3.remaining).toBe(0)
  })

  it('should return correct reset time', () => {
    const req = createMockRequest()
    const before = Date.now()
    const result = rateLimit(req, { maxRequests: 5, windowMs: 60000 })
    const after = Date.now()
    
    expect(result.resetTime).toBeGreaterThanOrEqual(before + 60000)
    expect(result.resetTime).toBeLessThanOrEqual(after + 60000)
  })
})

describe('withRateLimit', () => {
  it('should return 429 when rate limit is exceeded', async () => {
    const req = createMockRequest()
    const handler = async () => new Response('OK')
    const wrappedHandler = withRateLimit(handler, { maxRequests: 1, windowMs: 60000 })
    
    // First request should pass
    const response1 = await wrappedHandler(req)
    expect(response1.status).toBe(200)
    
    // Second request should be rate limited
    const response2 = await wrappedHandler(req)
    expect(response2.status).toBe(429)
    
    // Check headers
    expect(response2.headers.get('X-RateLimit-Limit')).toBe('1')
    expect(response2.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(response2.headers.get('Retry-After')).toBeDefined()
  })

  it('should return 500 when handler throws error', async () => {
    const req = createMockRequest()
    const handler = async () => {
      throw new Error('Handler error')
    }
    const wrappedHandler = withRateLimit(handler, { maxRequests: 5, windowMs: 60000 })
    
    const response = await wrappedHandler(req)
    expect(response.status).toBe(500)
  })

  it('should include rate limit headers on successful requests', async () => {
    const req = createMockRequest()
    const handler = async () => new Response('OK')
    const wrappedHandler = withRateLimit(handler, { maxRequests: 5, windowMs: 60000 })
    
    const response = await wrappedHandler(req)
    expect(response.status).toBe(200)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('4')
  })
})
