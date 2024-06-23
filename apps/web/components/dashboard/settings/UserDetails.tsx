"use client";

import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";

export default function UserDetails() {
  const { data: session } = useSession();

  if (!session?.user) return null;
  const details = [
    {
      label: "Name",
      value: session.user.name ?? undefined,
    },
    {
      label: "Email",
      value: session.user.email ?? undefined,
    },
  ];

  return (
    <div className="mb-8 flex flex-col sm:flex-row">
      <div className="mb-4 w-full text-lg font-medium sm:w-1/3">
        Basic Details
      </div>
      <div className="w-full">
        {details.map(({ label, value }) => (
          <div className="mb-2" key={label}>
            <div className="mb-2 text-sm font-medium">{label}</div>
            <Input value={value} disabled />
          </div>
        ))}
      </div>
    </div>
  );
}
