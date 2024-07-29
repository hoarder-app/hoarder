"use client";

import { useTheme } from "next-themes";

export default function Error() {
  const { theme } = useTheme();

  return (
    <div className={`flex h-screen w-full items-center justify-center`}>
      <div
        className={`rounded-lg p-6 text-center shadow-lg ${
          theme === "dark"
            ? "border border-red-500 bg-gray-800 text-white"
            : "border border-red-500 bg-white text-gray-900"
        }`}
      >
        <div className="mb-4 text-3xl font-bold">Oops!</div>
        <div className="text-lg">
          Something went wrong. Please try again later.
        </div>
      </div>
    </div>
  );
}
