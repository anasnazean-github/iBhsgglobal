"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
}

export function FeatureCard({ className, title, description, ...props }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group relative aspect-[4/3] w-full max-w-[250px] bg-[#E5E5E5] hover:bg-[#DCDCDC] border border-zinc-300/40 rounded-lg flex items-center justify-center p-6 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer select-none overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Title State (default visible, hover hidden) */}
      <span className="font-primary text-base font-bold text-zinc-950 transition-all duration-300 group-hover:opacity-0 group-hover:scale-90 text-center px-4 absolute pointer-events-none">
        {title}
      </span>

      {/* Description State (default hidden, hover visible) */}
      <span className="font-primary text-xs leading-relaxed font-medium text-zinc-700 transition-all duration-300 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 text-center px-5 absolute pointer-events-none">
        {description}
      </span>
    </div>
  );
}
