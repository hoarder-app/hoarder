import React from "react";
import { Copy, CopyCheck } from "lucide-react";

export default function CopyBtn({
  classes,
  getStringToCopy,
}: {
  classes?: string;
  getStringToCopy: () => string;
}) {
  const [copyOk, setCopyOk] = React.useState(false);
  const isDisabled = !navigator.clipboard;

  const handleClick = async () => {
    await navigator.clipboard.writeText(getStringToCopy());
    setCopyOk(true);
    setTimeout(() => {
      setCopyOk(false);
    }, 2000);
  };

  return (
    <div className={classes}>
      {copyOk ? (
        <button onClick={handleClick}>
          <CopyCheck />
        </button>
      ) : (
        <button
          onClick={handleClick}
          disabled={isDisabled}
          title={
            isDisabled ? "Copying is only available on localhost or https" : ""
          }
        >
          <Copy />
        </button>
      )}
    </div>
  );
}
