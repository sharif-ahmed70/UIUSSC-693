'use client'

import { useState } from 'react'

function getSafeUrl(src: string | null | undefined){
  if(!src) return null
  if(src.startsWith('/')) return src

  try {
    const url = new URL(src)
    return url.protocol === 'https:' ? src : null
  } catch {
    return null
  }
}

export default function SafeImage({
  src,
  alt,
  className = '',
  priority = false,
}: {
  src?: string | null
  alt: string
  className?: string
  priority?: boolean
}){
  const [failed, setFailed] = useState(false)
  const safeSrc = getSafeUrl(src)

  if(!safeSrc || failed){
    return (
      <div className={`relative overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(255,101,0,0.28),transparent_26rem),linear-gradient(135deg,#151312,#2a241f_55%,#ff6500)] ${className}`}>
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.12),transparent_45%)]" />
      </div>
    )
  }

  return (
    <img
      src={safeSrc}
      alt={alt}
      className={`object-cover ${className}`}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      onError={() => setFailed(true)}
    />
  )
}
