"use client";

import * as React from "react";

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "danger" | "dark" | "ghost";
  children: React.ReactNode;
}

export function CustomButton({ variant = "default", children, className = "", ...props }: CustomButtonProps) {
  // Height is exactly h-8 (32px), Corner Radius is rounded (4px)
  const baseStyle = "h-8 px-4 text-xs font-bold rounded border shadow-sm flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50 disabled:pointer-events-none";
  
  let variantStyle = "";
  if (variant === "default") {
    // Neutral EEEEEE button
    variantStyle = "bg-[#EEEEEE] border-zinc-300 text-zinc-700 hover:text-zinc-950 hover:bg-[#E5E5E5]/20";
  } else if (variant === "secondary") {
    // Neutral E5E5E5 button
    variantStyle = "bg-[#E5E5E5] border-zinc-300 text-zinc-700 hover:text-zinc-950 hover:bg-[#EEEEEE]/50";
  } else if (variant === "dark") {
    // Dark zinc button
    variantStyle = "bg-zinc-800 border-zinc-900 text-[#EEEEEE] hover:bg-zinc-900 hover:text-white";
  } else if (variant === "danger") {
    // Rose border/warning button
    variantStyle = "bg-[#EEEEEE] border-zinc-300 text-red-600 hover:text-red-700 hover:bg-red-50";
  } else if (variant === "ghost") {
    // Transparent background, borderless, shadowless button
    variantStyle = "bg-transparent border-transparent text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 shadow-none";
  }

  return (
    <button className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </button>
  );
}
