"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const cardVariants = cva(
  "w-full max-w-2xl mx-auto rounded-xl border bg-slate-900/60 text-slate-100 shadow-lg flex flex-col transition-colors [border:1px_solid_rgba(255,255,255,.08)] [box-shadow:0_-20px_80px_-20px_#ffffff0a_inset]",
  {
    variants: {
      isExpanded: {
        true: "h-auto",
        false: "h-auto",
      },
    },
    defaultVariants: {
      isExpanded: true,
    },
  },
);

export interface EmailClientCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  avatarSrc: string;
  avatarFallback: string;
  senderName: string;
  senderEmail: string;
  timestamp: string;
  message: string;
  actions?: React.ReactNode[];
  reactions?: string[];
  onReactionClick?: (reaction: string) => void;
  onActionClick?: (index: number) => void;
}

const EmailClientCard = React.forwardRef<HTMLDivElement, EmailClientCardProps>(
  (
    {
      className,
      avatarSrc,
      avatarFallback,
      senderName,
      senderEmail,
      timestamp,
      message,
      actions = [],
      reactions = [],
      onReactionClick,
      onActionClick,
      isExpanded,
      ...props
    },
    ref,
  ) => {
    const [inputValue, setInputValue] = React.useState("");

    const containerVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          staggerChildren: 0.05,
        },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    };

    return (
      <motion.div
        ref={ref}
        className={cn(cardVariants({ isExpanded }), className)}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Card Header */}
        <motion.div
          className="p-4 sm:p-6 flex items-start gap-4 border-b border-white/[0.06]"
          variants={itemVariants}
        >
          <Avatar className="w-10 h-10 border border-white/10">
            <AvatarImage src={avatarSrc} alt={senderName} />
            <AvatarFallback className="bg-slate-800 text-cyan-400 text-xs font-semibold">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow min-w-0">
            <p className="font-semibold text-slate-100 truncate">{senderName}</p>
            <p className="text-sm text-slate-500 truncate">{senderEmail}</p>
          </div>
          <div className="flex items-center gap-1 text-slate-500 shrink-0">
            <span className="text-xs hidden sm:inline">{timestamp}</span>
            {actions.map((action, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-slate-500 hover:text-slate-300 hover:bg-white/5"
                  onClick={() => onActionClick?.(index)}
                  aria-label={`Action ${index + 1}`}
                >
                  {action}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Card Body */}
        <motion.div
          className="p-4 sm:p-6 text-sm text-slate-300 leading-relaxed"
          variants={itemVariants}
        >
          <p>{message}</p>
        </motion.div>

        {/* Card Footer with Reply */}
        <motion.div
          className="p-3 sm:p-4 mt-auto border-t border-white/[0.06] bg-slate-950/30"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Reply..."
              className="flex-grow bg-slate-800/50 border-white/10 text-slate-300 placeholder:text-slate-600 focus-visible:ring-cyan-400/20 focus-visible:border-cyan-400/40"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <div className="flex items-center gap-1">
              {reactions.map((reaction, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.2, rotate: -5 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-xl hover:bg-white/5"
                    onClick={() => onReactionClick?.(reaction)}
                    aria-label={`React with ${reaction}`}
                  >
                    {reaction}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  },
);

EmailClientCard.displayName = "EmailClientCard";

export { EmailClientCard, cardVariants };
