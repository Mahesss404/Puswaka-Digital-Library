import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

const BookSkeleton = ({ className }) => {
  return (
    <div className={`flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100 ${className}`}>
      {/* Image Container Skeleton */}
      <div className="relative w-full aspect-[2/3] bg-gray-50">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Content Skeleton */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {/* Title Skeleton */}
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        
        {/* Author Skeleton */}
        <div className="mt-1">
          <Skeleton className="h-3 w-1/3" />
        </div>

        {/* Availability Skeleton */}
        <div className="mt-auto pt-2">
          <div className="flex items-center gap-1.5">
             <Skeleton className="w-2 h-2 rounded-full" />
             <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookSkeleton;
