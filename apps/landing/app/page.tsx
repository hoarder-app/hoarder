import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import screenshot from "@/public/screenshot.png";
import { ExternalLink, Github, PackageOpen } from "lucide-react";

const GITHUB_LINK = "https://github.com/MohamedBassem/hoarder-app";
const DOCS_LINK = "https://docs.hoarder.app";

function NavBar() {
  return (
    <div className="flex justify-between px-3 py-4">
      <div className="flex items-center justify-center gap-x-2">
        <PackageOpen size="40" className="" />
        <p className="text-2xl">Hoarder</p>
      </div>
      <div className="hidden gap-10 sm:flex">
        <Link
          href={DOCS_LINK}
          className="flex justify-center gap-2 text-center"
        >
          Docs
        </Link>
        <Link
          href={GITHUB_LINK}
          className="flex justify-center gap-2 text-center"
        >
          Github <ExternalLink />
        </Link>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="mt-32 flex flex-grow flex-col items-center justify-center gap-4">
      <div className="mt-4 w-full space-y-6 text-center">
        <p className="text-center text-5xl font-bold">
          The{" "}
          <span className="bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent">
            Bookmark Everything
          </span>{" "}
          App
        </p>
        <div className="mx-auto w-full gap-2 text-xl md:w-3/5">
          <p className="text-center text-gray-400">
            Quickly save links, notes, and images and hoarder will automatically
            tag them for you using AI for faster retrieval. Built for the data
            hoarders out there!
          </p>
          <p className="text-center text-gray-400">
            Open source, and self hostable!
          </p>
        </div>
      </div>
      <div className="flex h-10 gap-4">
        <Button className="h-full w-28" variant="default">
          Demo
        </Button>
        <Link
          href={GITHUB_LINK}
          className={cn(
            "flex h-full w-28 gap-2",
            buttonVariants({ variant: "outline" }),
          )}
        >
          <Github /> Github
        </Link>
      </div>
    </div>
  );
}

function Screenshots() {
  return (
    <div className="mx-auto mt-6 w-11/12">
      <Image alt="screenshot" src={screenshot} />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="container flex flex-col pb-10">
        <NavBar />
        <Hero />
      </div>
      <Screenshots />
    </div>
  );
}
