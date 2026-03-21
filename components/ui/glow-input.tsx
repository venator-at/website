"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface GlowInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  hint?: string;
}

export function GlowInput({ label, icon, hint, className, disabled, ...props }: GlowInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            {icon}
          </div>
        )}
        <input
          {...props}
          disabled={disabled}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            "w-full rounded-xl px-3.5 py-2.5 text-sm",
            "bg-white/[0.04] border text-white",
            "placeholder:text-white/20",
            "transition-all duration-200 outline-none",
            icon && "pl-9",
            focused
              ? "border-blue-500/50 bg-white/[0.06] shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
              : "border-white/[0.08] hover:border-white/[0.14]",
            disabled && "opacity-40 cursor-not-allowed",
            className
          )}
        />
      </div>
      {hint && <p className="text-xs text-white/30 pl-0.5">{hint}</p>}
    </div>
  );
}
