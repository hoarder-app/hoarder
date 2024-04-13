import React from "react";
import { useClientConfig } from "@/lib/clientConfig";

import type { ButtonProps } from "./button";
import { Button } from "./button";
import LoadingSpinner from "./spinner";

const ActionButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    loading: boolean;
    spinner?: React.ReactNode;
    ignoreDemoMode?: boolean;
  }
>(
  (
    { children, loading, spinner, disabled, ignoreDemoMode = false, ...props },
    ref,
  ) => {
    const clientConfig = useClientConfig();
    spinner ||= <LoadingSpinner />;
    if (!ignoreDemoMode && clientConfig.demoMode) {
      disabled = true;
    } else if (disabled !== undefined) {
      disabled ||= loading;
    } else if (loading) {
      disabled = true;
    }
    return (
      <Button ref={ref} {...props} disabled={disabled}>
        {loading ? spinner : children}
      </Button>
    );
  },
);
ActionButton.displayName = "ActionButton";

export { ActionButton };
