import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-[0.08em] cursor-pointer transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ae2v-green disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** CTA prioritaire — vert acide, usage rare et signifiant. */
        default: "bg-signal text-signal-foreground border-2 border-ae2v-black hover:bg-ae2v-green-dark",
        /** Action identitaire secondaire — rouge dominant. */
        secondary: "bg-primary text-primary-foreground border-2 border-ae2v-black hover:bg-ae2v-red-dark",
        /** Action neutre forte. */
        black: "bg-ae2v-black text-ae2v-offwhite border-2 border-ae2v-black hover:bg-ae2v-red",
        destructive: "bg-destructive text-destructive-foreground border-2 border-ae2v-black hover:bg-ae2v-red",
        outline:
          "border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background",
        ghost: "border-2 border-transparent hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline normal-case tracking-normal",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-13 px-8 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);


export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/** Fonds sombres/rouges : le curseur doit passer en version claire. */
const DARK_SURFACE_VARIANTS = new Set(["secondary", "black", "destructive"]);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const scheme = DARK_SURFACE_VARIANTS.has(variant ?? "default") ? "light" : undefined;
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        data-cursor-scheme={scheme}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
