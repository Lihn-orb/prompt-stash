"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "default" | "small" | "icon";
};

const variants = {
  primary:
    "border-[1.5px] border-ink bg-ink text-on-action hover:bg-accent hover:border-accent hover:text-on-action",
  secondary:
    "border-[1.5px] border-ink bg-surface-solid text-foreground hover:shadow-[3px_3px_0_0_var(--ink)]",
  ghost: "border-transparent text-secondary hover:bg-surface-raised hover:text-foreground",
  danger: "border-[1.5px] border-danger bg-danger text-on-action hover:brightness-110",
};

const sizes = {
  icon: "h-8 w-8 rounded-[5px] max-sm:h-11 max-sm:w-11",
  small: "min-h-8 rounded-[5px] px-3 text-[11px] uppercase tracking-[0.08em] max-sm:min-h-11",
  default: "min-h-9 rounded-[5px] px-4 text-[12px] uppercase tracking-[0.06em] max-sm:min-h-11",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", variant = "secondary", size = "default", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex shrink-0 items-center justify-center gap-2 font-medium transition-all active:translate-x-px active:translate-y-px disabled:pointer-events-none disabled:opacity-40 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
});

export function Hint({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="tooltip" sideOffset={7}>
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
