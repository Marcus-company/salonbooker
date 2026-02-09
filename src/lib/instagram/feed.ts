// Instagram Feed Service
// Uses Instagram Basic Display API

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  username: string;
}

interface InstagramFeedResponse {
  data: InstagramMedia[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

const INSTAGRAM_API_BASE = 'https://graph.instagram.com';

export async function getInstagramFeed(
  accessToken: string,
  limit: number = 12
): Promise<InstagramMedia[]> {
  try {
    const response = await fetch(
      `${INSTAGRAM_API_BASE}/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&limit=${limit}&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data: InstagramFeedResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Instagram feed:', error);
    return [];
  }
}

export async function refreshAccessToken(
  accessToken: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${INSTAGRAM_API_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

// Mock data for development (when no token is available)
export function getMockInstagramFeed(): InstagramMedia[] {
  return [
    {
      id: '1',
      caption: 'Prachtige balayage voor onze klant! ✨ #balayage #hairstyle',
      media_type: 'IMAGE',
      media_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=600&fit=crop',
      permalink: 'https://instagram.com/p/mock1',
      timestamp: '2026-02-08T10:00:00Z',
      username: 'hairsalonx',
    },
    {
      id: '2',
      caption: 'Voor en na transformatie! 😍 #hairtransformation #kapsel',
      media_type: 'IMAGE',
      media_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop',
      permalink: 'https://instagram.com/p/mock2',
      timestamp: '2026-02-07T14:30:00Z',
      username: 'hairsalonx',
    },
    {
      id: '3',
      caption: 'Kleurrijke highlights voor de lente 🌸 #highlights #springhair',
      media_type: 'IMAGE',
      media_url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&h=600&fit=crop',
      permalink: 'https://instagram.com/p/mock3',
      timestamp: '2026-02-06T09:15:00Z',
      username: 'hairsalonx',
    },
    {
      id: '4',
      caption: 'Team HairsalonX ready for the weekend! 💪 #team #salonlife',
      media_type: 'IMAGE',
      media_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=600&fit=crop',
      permalink: 'https://instagram.com/p/mock4',
      timestamp: '2026-02-05T16:00:00Z',
      username: 'hairsalonx',
    },
    {
      id: '5',
      caption: 'Bruidskapsel voor de mooiste dag 👰 #bride #weddinghair',
      media_type: 'IMAGE',
      media_url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&h=600&fit=crop',
      permalink: 'https://instagram.com/p/mock5',
      timestamp: '2026-02-04T11:20:00Z',
      username: 'hairsalonx',
    },
    {
      id: '6',
      caption: 'Herenkapsel met precisie ✂️ #menshair #fade',
      media_type: 'IMAGE',
      media_url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&h=600&fit=crop',
      permalink: 'https://instagram.com/p/mock6',
      timestamp: '2026-02-03T13:45:00Z',
      username: 'hairsalonx',
    },
  ];
}
