"use client";

import { Input } from "@/components/ui/input";
import { api } from "@/lib/trpc";
import { useTheme } from "next-themes";

export default function UserDetails() {
  const { theme } = useTheme();
  const { data: whoami, isLoading, error } = api.users.whoami.useQuery();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    console.error("Error fetching user details:", error);
    return <p>Error loading user details</p>;
  }

  const details = [
    {
      label: "Name",
      value: whoami?.name ?? "",
    },
    {
      label: "Email",
      value: whoami?.email ?? "",
    },
  ];

  return (
    <div
      className={`mb-8 flex flex-col rounded-lg p-6 sm:flex-row ${
        theme === "dark"
          ? "bg-gray-900 bg-opacity-70 text-white"
          : "bg-white bg-opacity-70 text-gray-900"
      } backdrop-blur-lg backdrop-filter`}
    >
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
