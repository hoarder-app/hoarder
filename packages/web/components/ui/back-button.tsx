"use client";

import { useRouter } from "next/navigation";
import { Button, ButtonProps } from "./button";

export function BackButton({ ...props }: ButtonProps) {
  const router = useRouter();
  return <Button {...props} onClick={() => router.back()} />;
}
