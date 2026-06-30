"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  isActive?: boolean;
  icon?: React.ReactNode;
  isCollapsed?: boolean;
}

export const MenuButton = React.forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ className, label, isActive, icon, isCollapsed = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex items-center rounded py-3 text-sm font-medium transition-all duration-200 ease-in-out font-primary select-none outline-none",
          isCollapsed ? "w-10 h-10 justify-center mx-auto px-0" : "w-full gap-3 px-4 text-left",
          "text-zinc-700 hover:text-zinc-900 focus-visible:text-zinc-900",
          "hover:bg-[#EEEEEE] hover:shadow-sm",
          "focus-visible:bg-[#EEEEEE] focus-visible:shadow-sm focus-visible:ring-2 focus-visible:ring-zinc-400/20",
          isActive && "bg-[#EEEEEE] text-zinc-950 shadow-sm font-semibold",
          className
        )}
        title={isCollapsed ? label : undefined}
        {...props}
      >
        {icon && <span className="flex-shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-900">{icon}</span>}
        {!isCollapsed && <span className="truncate">{label}</span>}
      </button>
    );
  }
);

MenuButton.displayName = "MenuButton";
