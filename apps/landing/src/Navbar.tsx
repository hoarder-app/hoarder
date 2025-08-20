import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router";

import { DEMO_LINK, DOCS_LINK, GITHUB_LINK } from "./constants";
import Logo from "/icons/karakeep-full.svg?url";

export default function NavBar() {
  return (
    <div className="flex justify-between px-3 py-4">
      <Link to="/">
        <img src={Logo} alt="logo" className="w-36" />
      </Link>
      <div className="hidden items-center gap-6 sm:flex">
        <Link to="/pricing" className="flex justify-center gap-2 text-center">
          Pricing
        </Link>
        <a
          href={DOCS_LINK}
          target="_blank"
          className="flex justify-center gap-2 text-center"
          rel="noreferrer"
        >
          Docs
        </a>
        <a
          href={GITHUB_LINK}
          target="_blank"
          className="flex justify-center gap-2 text-center"
          rel="noreferrer"
        >
          GitHub
        </a>
        <a
          href="https://cloud.karakeep.app"
          target="_blank"
          className={cn(
            "text flex h-full w-20 gap-2",
            buttonVariants({ variant: "outline" }),
          )}
          rel="noreferrer"
        >
          Login
        </a>
        <a
          href={DEMO_LINK}
          target="_blank"
          className={cn(
            "text flex h-full w-28 gap-2",
            buttonVariants({ variant: "default" }),
          )}
          rel="noreferrer"
        >
          Try Demo
        </a>
      </div>
    </div>
  );
}
