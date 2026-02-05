import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiting
// For production, use Redis or similar
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  // Maximum requests per window
  maxRequests: number
  // Window size in seconds
  windowMs: number
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  maxRequests: 100,
  windowMs: 60 * 1000 // 1 minute
}

export function rateLimit(
  request: NextRequest,
  options: Partial<RateLimitOptions> = {}
): { success: boolean; limit: number; remaining: number; resetTime: number } {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  // Get client IP
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const key = `${ip}:${request.nextUrl.pathname}`
  
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  
  // Clean up expired entries
  if (entry && entry.resetTime < now) {
    rateLimitMap.delete(key)
  }
  
  // Get or create entry
  const current = rateLimitMap.get(key)
  if (!current) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    }
  }
  
  // Check if limit exceeded
  if (current.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: current.resetTime
    }
  }
  
  // Increment count
  current.count++
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime
  }
}

// Higher order function for API route rate limiting
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: Partial<RateLimitOptions> = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = rateLimit(request, options)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000) },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }
    
    const response = await handler(request)
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
    
    return response
  }
}
