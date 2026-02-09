import { NextRequest, NextResponse } from 'next/server'

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID

// GET /api/instagram/feed - Fetch Instagram posts
export async function GET(req: NextRequest) {
  try {
    if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
      return NextResponse.json(
        { 
          error: 'Instagram not configured',
          posts: getMockPosts() // Return mock data for demo
        },
        { status: 200 }
      )
    }

    // Fetch media from Instagram Basic Display API
    const response = await fetch(
      `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${INSTAGRAM_ACCESS_TOKEN}&limit=12`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch Instagram feed')
    }

    const data = await response.json()
    
    // Format posts
    const posts = data.data?.map((post: any) => ({
      id: post.id,
      caption: post.caption,
      mediaType: post.media_type,
      mediaUrl: post.media_url,
      thumbnailUrl: post.thumbnail_url,
      permalink: post.permalink,
      timestamp: post.timestamp,
    })) || []

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Instagram feed error:', error)
    // Return mock data on error
    return NextResponse.json({ 
      posts: getMockPosts(),
      error: 'Using mock data - Instagram API error'
    })
  }
}

// Mock posts for demo/fallback
function getMockPosts() {
  return [
    {
      id: '1',
      caption: 'Prachtige balayage voor deze klant! ✨ #balayage #hairstyle',
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600',
      permalink: '#',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      caption: 'Voor en na transformatie! 💇‍♀️ #hairtransformation',
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600',
      permalink: '#',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      caption: 'Nieuwe knipbeurt klaar! ✂️ #haircut',
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1599351431202-0e671340044d?w=600',
      permalink: '#',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: '4',
      caption: 'Bruidskapsel voor deze mooie bruid 👰 #bridalhair',
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600',
      permalink: '#',
      timestamp: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: '5',
      caption: 'Highlights voor de zomer ☀️ #highlights',
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600',
      permalink: '#',
      timestamp: new Date(Date.now() - 345600000).toISOString(),
    },
    {
      id: '6',
      caption: 'Heren knipbeurt met baard trim 🧔 #menshaircut',
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600',
      permalink: '#',
      timestamp: new Date(Date.now() - 432000000).toISOString(),
    },
  ]
}
