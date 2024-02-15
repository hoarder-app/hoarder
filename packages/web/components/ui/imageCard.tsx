import * as React from "react";

import { cn } from "@/lib/utils";

export function ImageCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("h-96 overflow-hidden rounded-lg shadow-md", className)}
      {...props}
    />
  );
}

export function ImageCardBanner({
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={cn("h-56 min-h-56 w-full object-cover", className)}
      alt="card banner"
      {...props}
    />
  );
}

export function ImageCardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex h-40 min-h-40 flex-col justify-between p-2",
        className,
      )}
      {...props}
    />
  );
}

export function ImageCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("order-first flex-none text-lg font-bold", className)}
      {...props}
    />
  );
}

export function ImageCardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("order-1", className)} {...props} />;
}

export function ImageCardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("order-last", className)} {...props} />;
}
