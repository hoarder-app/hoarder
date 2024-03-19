import { useClientConfig } from "@/lib/clientConfig";

import type { ButtonProps } from "./button";
import { Button } from "./button";
import LoadingSpinner from "./spinner";

export function ActionButton({
  children,
  loading,
  spinner,
  disabled,
  ignoreDemoMode = false,
  ...props
}: ButtonProps & {
  loading: boolean;
  spinner?: React.ReactNode;
  ignoreDemoMode?: boolean;
}) {
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
    <Button {...props} disabled={disabled}>
      {loading ? spinner : children}
    </Button>
  );
}
