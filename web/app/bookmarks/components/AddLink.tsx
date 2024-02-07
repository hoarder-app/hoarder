"use client";

import APIClient from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddLink() {
  const router = useRouter();
  const [link, setLink] = useState("");

  const bookmarkLink = async () => {
    const [_resp, error] = await APIClient.bookmarkLink(link);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="p-4">
      <input
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
        className="w-10/12 px-4 py-2 border rounded-md focus:outline-none focus:border-blue-300"
      />
      <button className="w-2/12 px-1 py-2" onClick={bookmarkLink}>
        Submit
      </button>
    </div>
  );
}
