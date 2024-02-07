"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import APIClient from "@/lib/api";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddLink() {
  const router = useRouter();
  const [link, setLink] = useState("");

  const bookmarkLink = async () => {
    const [_resp, error] = await APIClient.bookmarkLink(link);
    if (error) {
      // TODO: Proper error handling
      alert(error.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="py-4 container flex w-full items-center space-x-2">
      <Input
        type="text"
        placeholder="Link"
        value={link}
        onChange={(val) => setLink(val.target.value)}
        onKeyUp={async (event) => {
          if (event.key == "Enter") {
            bookmarkLink();
            setLink("");
          }
        }}
      />
      <Button onClick={bookmarkLink}>
        <Plus />
      </Button>
    </div>
  );
}
