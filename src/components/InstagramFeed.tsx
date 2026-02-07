'use client'

import { useEffect, useState } from 'react'

interface InstagramPost {
  id: string
  media_url: string
  permalink: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  thumbnail_url?: string
}

export default function InstagramFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Voor nu: mock data tot Instagram API key beschikbaar is
    // Later vervangen door: fetch('/api/instagram')
    const mockPosts: InstagramPost[] = [
      {
        id: '1',
        media_url: '/images/instagram/placeholder-1.jpg',
        permalink: 'https://instagram.com/hairsalonx',
        caption: 'Prachtige balayage voor onze klant! 💇‍♀️✨',
        media_type: 'IMAGE'
      },
      {
        id: '2',
        media_url: '/images/instagram/placeholder-2.jpg',
        permalink: 'https://instagram.com/hairsalonx',
        caption: 'BTS: onze stylist aan het werk 💪',
        media_type: 'IMAGE'
      },
      {
        id: '3',
        media_url: '/images/instagram/placeholder-3.jpg',
        permalink: 'https://instagram.com/hairsalonx',
        caption: 'Fresh cut voor het weekend! 🔥',
        media_type: 'IMAGE'
      },
      {
        id: '4',
        media_url: '/images/instagram/placeholder-4.jpg',
        permalink: 'https://instagram.com/hairsalonx',
        caption: 'Voor en na transformatie ✨',
        media_type: 'IMAGE'
      },
      {
        id: '5',
        media_url: '/images/instagram/placeholder-5.jpg',
        permalink: 'https://instagram.com/hairsalonx',
        caption: 'Bruidskapsel gecreëerd door ons team 👰',
        media_type: 'IMAGE'
      },
      {
        id: '6',
        media_url: '/images/instagram/placeholder-6.jpg',
        permalink: 'https://instagram.com/hairsalonx',
        caption: 'Nieuwe kleur, nieuwe look! 💜',
        media_type: 'IMAGE'
      }
    ]

    // Simuleer API call
    setTimeout(() => {
      setPosts(mockPosts)
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-slate-200 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Instagram feed tijdelijk niet beschikbaar</p>
        <a 
          href="https://instagram.com/hairsalonx" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-slate-900 hover:underline mt-2 inline-block"
        >
          Bekijk op Instagram →
        </a>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {posts.map((post) => (
        <a
          key={post.id}
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
            style={{ 
              backgroundImage: `url(${post.thumbnail_url || post.media_url})`,
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
              Bekijk op Instagram
            </span>
          </div>
          {post.media_type === 'VIDEO' && (
            <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 5.84a.75.75 0 00-1.06 1.06l4.78 4.78-4.78 4.78a.75.75 0 101.06 1.06l5.25-5.25a.75.75 0 000-1.06L6.3 5.84z" />
              </svg>
            </div>
          )}
        </a>
      ))}
    </div>
  )
}
