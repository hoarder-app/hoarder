import React, { useEffect } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyBtn({
  className,
  getStringToCopy,
}: {
  className?: string;
  getStringToCopy: () => string;
}) {
  const [copyOk, setCopyOk] = React.useState(false);
  const [disabled, setDisabled] = React.useState(false);
  useEffect(() => {
    if (!navigator || !navigator.clipboard) {
      setDisabled(true);
    }
  });

  const handleClick = async () => {
    await navigator.clipboard.writeText(getStringToCopy());
    setCopyOk(true);
    setTimeout(() => {
      setCopyOk(false);
    }, 2000);
  };

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={disabled}
      title={disabled ? "Copying is only available over https" : undefined}
    >
      {copyOk ? <Check /> : <Copy />}
    </button>
  );
}
