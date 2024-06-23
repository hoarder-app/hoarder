"use client";

import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";

export default function UserDetails() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="mb-8 flex flex-col sm:flex-row">
      <div className="mb-4 w-full text-lg font-medium sm:w-1/3">
        Basic Details
      </div>
      <div className="w-full">
        <div className="mb-2 text-sm font-medium">Name</div>
        <Input value={session.user.name} disabled />
        <div className="mb-2 mt-2 text-sm font-medium">Email</div>
        <Input value={session.user.email} disabled className="block" />
      </div>
    </div>
  );
}
