'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getInstagramFeed, getMockInstagramFeed, type InstagramMedia } from '@/lib/instagram/feed';
import { Skeleton } from '@/components/skeleton';

interface InstagramGalleryProps {
  accessToken?: string;
  limit?: number;
  showHeader?: boolean;
}

export default function InstagramGallery({
  accessToken,
  limit = 6,
  showHeader = true,
}: InstagramGalleryProps) {
  const [posts, setPosts] = useState<InstagramMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [accessToken, limit]);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      // If no access token, use mock data
      if (!accessToken || accessToken === 'mock') {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        setPosts(getMockInstagramFeed().slice(0, limit));
      } else {
        const data = await getInstagramFeed(accessToken, limit);
        setPosts(data);
      }
    } catch (err) {
      setError('Failed to load Instagram feed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 md:py-16">
        {showHeader && (
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="aspect-square">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">{error}</p>
        <button
          onClick={fetchPosts}
          className="mt-4 text-blue-600 hover:underline"
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showHeader && (
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Volg ons op Instagram
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              @hairsalonx — Inspiratie voor je volgende look
            </p>
            <Link
              href="https://instagram.com/hairsalonx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-pink-600 hover:text-pink-700 font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @hairsalonx
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {posts.map((post) => (
            <InstagramPost key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

function InstagramPost({ post }: { post: InstagramMedia }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatCaption = (caption?: string) => {
    if (!caption) return '';
    // Truncate and remove hashtags for preview
    const text = caption.replace(/#[\w]+/g, '').trim();
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  return (
    <Link
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
    >
      {/* Image */}
      <img
        src={post.media_url}
        alt={post.caption || 'Instagram post'}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
        <div className="text-center text-white">
          <p className="text-sm line-clamp-3">{formatCaption(post.caption)}</p>
          <div className="mt-3 flex items-center justify-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              Bekijk
            </span>
          </div>
        </div>
      </div>

      {/* Loading placeholder */}
      {!imageLoaded && (
        <div className="absolute inset-0 animate-pulse bg-slate-200" />
      )}

      {/* Video indicator */}
      {post.media_type === 'VIDEO' && (
        <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
          </svg>
        </div>
      )}

      {/* Carousel indicator */}
      {post.media_type === 'CAROUSEL_ALBUM' && (
        <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
        </div>
      )}
    </Link>
  );
}
