# Instagram Feed Integration [sXJaWnrF]

## Features

- ✅ Instagram Basic Display API integration
- ✅ Responsive gallery grid (2/3/6 columns)
- ✅ Lazy loading with skeleton placeholders
- ✅ Hover overlay with caption preview
- ✅ Video and carousel indicators
- ✅ Mock data for development

## Setup

### 1. Get Instagram Access Token

1. Go to https://developers.facebook.com/apps
2. Create new app → "Other" → "Consumer"
3. Add "Instagram Basic Display" product
4. Create test user
5. Get access token (valid for 60 days)

### 2. Environment Variables

Add to `.env.local`:
```
INSTAGRAM_ACCESS_TOKEN=your_token_here
```

### 3. Refresh Token

Token expires every 60 days. Set up a cron job to refresh:
```javascript
// /api/instagram/refresh/route.ts
import { refreshAccessToken } from '@/lib/instagram/feed';
```

## Usage

```tsx
import InstagramGallery from '@/components/instagram/InstagramGallery';

// With real token
<InstagramGallery accessToken={process.env.INSTAGRAM_ACCESS_TOKEN} limit={6} />

// With mock data (for development)
<InstagramGallery limit={6} />
```

## API Endpoints

### Get Feed
```
GET /api/instagram/feed?limit=6
```

### Refresh Token
```
POST /api/instagram/refresh
```

## Mobile Responsive

- Mobile: 2 columns
- Tablet: 3 columns
- Desktop: 6 columns

## Performance

- Lazy loading images
- Skeleton placeholders
- Optimized grid layout
