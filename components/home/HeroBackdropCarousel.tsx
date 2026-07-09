'use client'

import { useEffect, useState } from 'react'
import SafeImage from '@/components/media/SafeImage'

export default function HeroBackdropCarousel({ images }: { images: string[] }){
  const [activeIndex, setActiveIndex] = useState(0)
  const media = images.length > 0 ? images : [null]

  useEffect(() => {
    if(media.length <= 1) return

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % media.length)
    }, 6000)

    return () => window.clearInterval(interval)
  }, [media.length])

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {media.map((image, index) => (
        <div
          key={`${image ?? 'fallback'}-${index}`}
          className={`absolute inset-0 transition duration-1000 ease-out ${
            index === activeIndex ? 'scale-100 opacity-100' : 'scale-[1.03] opacity-0'
          }`}
        >
          <SafeImage src={image} alt="" className="h-full w-full opacity-60" priority={index === 0} />
        </div>
      ))}
    </div>
  )
}
