import { Button, ButtonProps } from "./button";
import LoadingSpinner from "./spinner";

export function ActionButton({
  children,
  loading,
  spinner,
  disabled,
  ...props
}: ButtonProps & {
  loading: boolean;
  spinner?: React.ReactNode;
}) {
  spinner ||= <LoadingSpinner />;
  if (disabled !== undefined) {
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
