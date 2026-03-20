You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
email-client-card.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // Assuming you have a utils file for `cn`

// ShadCN UI Primitives (install via CLI)
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const cardVariants = cva(
  'w-full max-w-2xl mx-auto rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col transition-colors',
  {
    variants: {
      isExpanded: {
        true: 'h-auto',
        false: 'h-auto', // Placeholder for potential collapsed styles
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
    const [inputValue, setInputValue] = React.useState('');

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
        {...props}
      >
        {/* Card Header */}
        <motion.div
          className="p-4 sm:p-6 flex items-start gap-4 border-b"
          variants={itemVariants}
        >
          <Avatar className="w-10 h-10 border">
            <AvatarImage src={avatarSrc} alt={senderName} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <p className="font-semibold text-card-foreground">{senderName}</p>
            <p className="text-sm text-muted-foreground">{senderEmail}</p>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
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
                  className="w-8 h-8"
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
          className="p-4 sm:p-6 text-sm text-foreground/90 leading-relaxed"
          variants={itemVariants}
        >
          <p>{message}</p>
        </motion.div>

        {/* Card Footer with Reply */}
        <motion.div
          className="p-3 sm:p-4 mt-auto border-t bg-muted/50"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Type here..."
              className="flex-grow bg-background focus-visible:ring-1 focus-visible:ring-offset-0"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <div className="flex items-center gap-1">
              {reactions.map((reaction, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.2, rotate: -5 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-xl"
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

EmailClientCard.displayName = 'EmailClientCard';

export { EmailClientCard, cardVariants };

demo.tsx
import { EmailClientCard } from '@/components/ui/email-client-card';
import { Send, Trash, Plus } from 'lucide-react';

const EmailClientCardDemo = () => {
  // Sample data to populate the component
  const emailData = {
    avatarSrc: 'https://i.pravatar.cc/150',
    avatarFallback: 'SL',
    senderName: 'Samantha Lusan',
    senderEmail: 'samantha@icloud.com',
    timestamp: 'Yesterday, 10:12 am',
    message:
      "Yes, they've introduced new APIs for smoother and more dynamic animations. The enhancements to the core animation framework will make it easier to create more engaging user experiences.",
    reactions: ['😍', '❤️', '🔥', '⚡️', '👍'],
  };

  const handleReaction = (reaction: string) => {
    console.log(`Reacted with: ${reaction}`);
    // Add logic to handle the reaction
  };

  const handleAction = (index: number) => {
    const action = ['Send', 'Delete'][index];
    console.log(`Action clicked: ${action}`);
    // Add logic for actions
  };

  return (
    <div className="flex items-center justify-center h-full w-full p-4 bg-background">
      <EmailClientCard
        avatarSrc={emailData.avatarSrc}
        avatarFallback={emailData.avatarFallback}
        senderName={emailData.senderName}
        senderEmail={emailData.senderEmail}
        timestamp={emailData.timestamp}
        message={emailData.message}
        reactions={emailData.reactions}
        onReactionClick={handleReaction}
        onActionClick={handleAction}
        actions={[
          <Send key="send" className="w-4 h-4" />,
          <Trash key="trash" className="w-4 h-4" />,
        ]}
      />
    </div>
  );
};

export default EmailClientCardDemo;
```

Copy-paste these files for dependencies:
```tsx
originui/input
import { cn } from "@/lib/utils";
import * as React from "react";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
          type === "search" &&
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
          type === "file" &&
            "p-0 pr-3 italic text-muted-foreground/70 file:me-3 file:h-full file:border-0 file:border-r file:border-solid file:border-input file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic file:text-foreground",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

```
```tsx
shadcn/avatar
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className,
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className,
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }

```
```tsx
shadcn/button
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }

```

Install NPM dependencies:
```bash
framer-motion, class-variance-authority, @radix-ui/react-avatar, @radix-ui/react-slot
```

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's argumens and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies
 2. Fill image assets with Unsplash stock images you know exist
 3. Use lucide-react icons for svgs or logos if component requires them