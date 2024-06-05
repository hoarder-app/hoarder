import React from "react";
import { Copy, CopyCheck } from "lucide-react";

function getStringToCopy(child: React.ReactNode): string {
  if (
    React.isValidElement(child) &&
    "props" in child &&
    "children" in child.props
  ) {
    const element = child as React.ReactElement<{ children: string }>;
    return element.props.children;
  }
  return "";
}

export default function CodeCopyBtn({
  children: child,
}: {
  children: React.ReactNode;
}) {
  const [copyOk, setCopyOk] = React.useState(false);

  const handleClick = async () => {
    await navigator.clipboard.writeText(getStringToCopy(child));
    setCopyOk(true);
    setTimeout(() => {
      setCopyOk(false);
    }, 500);
  };

  return (
    <div className="absolute right-2 top-2 transform cursor-pointer text-xl text-white transition-all duration-300 ease-in-out hover:scale-110 hover:opacity-90">
      {copyOk ? (
        <CopyCheck onClick={handleClick}></CopyCheck>
      ) : (
        <Copy onClick={handleClick}></Copy>
      )}
    </div>
  );
}
