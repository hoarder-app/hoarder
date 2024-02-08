import * as React from "react";

import { cn } from "@/lib/utils";

export function ImageCard({
  children,
  image,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { image?: string }) {
  return (
    <div
      className={cn("h-96 rounded-lg overflow-hidden shadow-md", className)}
      {...props}
    >
      <div
        className="h-3/5 bg-cover bg-center"
        style={{
          backgroundImage: image ? `url(${image})` : undefined,
        }}
      ></div>
      <div className="flex flex-col h-2/5 p-2">{children}</div>
    </div>
  );
}

export function ImageCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("order-first flex-none font-bold text-lg", className)}
      {...props}
    />
  );
}

export function ImageCardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grow order-1 font-bold text-lg", className)}
      {...props}
    />
  );
}

export function ImageCardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("order-last", className)} {...props} />;
}
