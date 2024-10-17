"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export default function ErrorToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast({ variant: "destructive", description: error });

      const newParams = new URLSearchParams(searchParams);
      newParams.delete("error");
      router.replace(pathname + "?" + newParams.toString());
    }
  }, [searchParams, pathname, router, toast]);

  return null;
}
