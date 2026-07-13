import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=800&auto=format&fit=crop';
  const activeImage = images[activeIndex] || fallbackImage;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Active Image Display */}
      <div
        onClick={() => setLightboxOpen(true)}
        className="relative aspect-video bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 cursor-zoom-in group"
      >
        <img
          src={activeImage}
          alt={`${title} - ${activeIndex + 1}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
        />

        {/* Floating Zoom Controls */}
        <div className="absolute top-4 right-4 bg-zinc-900/60 backdrop-blur-sm p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="h-5 w-5" />
        </div>

        {/* Overlay pagination count */}
        {images.length > 1 && (
          <span className="absolute bottom-4 right-4 bg-zinc-900/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {activeIndex + 1} / {images.length}
          </span>
        )}

        {/* Carousel buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-zinc-950/80 hover:bg-white dark:hover:bg-zinc-950 text-zinc-900 dark:text-white p-2 rounded-full shadow-lg transition-all border border-gray-100 dark:border-zinc-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-zinc-950/80 hover:bg-white dark:hover:bg-zinc-950 text-zinc-900 dark:text-white p-2 rounded-full shadow-lg transition-all border border-gray-100 dark:border-zinc-800"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails list */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2.5">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 border-2 transition-all ${index === activeIndex ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent hover:border-gray-200 dark:hover:border-zinc-700'}`}
            >
              <img
                src={img}
                alt={`${title} thumbnail ${index + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox / Fullscreen Dialog */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col justify-center items-center">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="h-7 w-7" />
          </button>

          <div className="relative max-w-5xl max-h-[80vh] w-full px-4 flex justify-center items-center">
            <img
              src={activeImage}
              alt={title}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          <p className="text-white/60 text-sm mt-4 tracking-wide">
            {title} — Slide {activeIndex + 1} of {images.length}
          </p>
        </div>
      )}
    </div>
  );
}
