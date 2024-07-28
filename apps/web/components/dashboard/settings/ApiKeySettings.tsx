"use client";

import { useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/trpc";
import { useTheme } from "next-themes";

import AddApiKey from "./AddApiKey";
import DeleteApiKey from "./DeleteApiKey";

export default function ApiKeys() {
  const { theme } = useTheme();
  const { data: keys, error } = api.apiKeys.list.useQuery();

  useEffect(() => {
    if (error) {
      console.error("Error fetching API keys:", error);
    }
  }, [error]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div
          className={`mb-2 text-lg font-medium ${theme === "dark" ? "text-white" : "text-black"}`}
        >
          API Keys
        </div>
        <AddApiKey />
      </div>
      <div className="mt-2">
        <Table
          className={`bg-opacity-60 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"} backdrop-blur-lg backdrop-filter`}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys?.keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell>{k.name}</TableCell>
                <TableCell>**_{k.keyId}_**</TableCell>
                <TableCell>{new Date(k.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <DeleteApiKey name={k.name} id={k.id} />
                </TableCell>
              </TableRow>
            ))}
            <TableRow></TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
