// apps/web/src/components/logo.tsx
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      width="70"
      height="70"
      viewBox="0 0 70 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-6", className)}
    >
      <path
        d="M0 14.3015C0 6.403 6.403 0 14.3015 0H55.0607C62.9592 0 69.3622 6.403 69.3622 14.3015V55.0607C69.3622 62.9592 62.9592 69.3622 55.0607 69.3622H14.3015C6.403 69.3622 0 62.9592 0 55.0607V14.3015Z"
        fill="#FCA06F"
      />
      <path d="M18.9495 39.925H29.4372V50.4128H18.9495V39.925Z" fill="#36322D" />
      <path d="M29.4372 39.925H39.925V50.4128H29.4372V39.925Z" fill="#36322D" />
      <path d="M29.4372 29.4372H39.925V39.925H29.4372V29.4372Z" fill="#36322D" />
      <path d="M39.925 29.4372H50.4128V39.925H39.925V29.4372Z" fill="#36322D" />
      <path d="M39.925 18.9495H50.4128V29.4372H39.925V18.9495Z" fill="#36322D" />
      <path d="M18.9495 18.9495H29.4372V29.4372H18.9495V18.9495Z" fill="#36322D" />
    </svg>
  );
}