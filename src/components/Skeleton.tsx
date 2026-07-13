import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-700/50 p-4 space-y-4 animate-pulse">
      {/* Image Box */}
      <div className="aspect-video bg-gray-200 dark:bg-zinc-700 rounded-lg w-full"></div>
      
      {/* Specs bar */}
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/6"></div>
      </div>

      {/* Title */}
      <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded w-3/4"></div>

      {/* Bento spec grids */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="h-6 bg-gray-100 dark:bg-zinc-900/50 rounded w-full"></div>
        <div className="h-6 bg-gray-100 dark:bg-zinc-900/50 rounded w-full"></div>
      </div>

      {/* Price block */}
      <div className="pt-3 border-t border-gray-100 dark:border-zinc-700/50 flex justify-between items-center">
        <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/4"></div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DetailsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-8">
      {/* Breadcrumbs placeholder */}
      <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/4"></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <div className="aspect-video bg-gray-200 dark:bg-zinc-700 rounded-xl w-full"></div>
          <div className="grid grid-cols-4 gap-2">
            <div className="aspect-square bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
            <div className="aspect-square bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
            <div className="aspect-square bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
            <div className="aspect-square bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
          </div>
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-zinc-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/2"></div>
          
          <div className="border-t border-b border-gray-100 dark:border-zinc-800 py-4 space-y-3">
            <div className="h-10 bg-gray-200 dark:bg-zinc-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/4"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-gray-100 dark:bg-zinc-900 rounded"></div>
            <div className="h-12 bg-gray-100 dark:bg-zinc-900 rounded"></div>
            <div className="h-12 bg-gray-100 dark:bg-zinc-900 rounded"></div>
            <div className="h-12 bg-gray-100 dark:bg-zinc-900 rounded"></div>
          </div>

          <div className="h-20 bg-gray-200 dark:bg-zinc-700 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
}
