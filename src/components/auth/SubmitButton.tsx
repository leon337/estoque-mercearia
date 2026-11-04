"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/Button";

type SubmitButtonProps = ButtonProps & { pendingText?: string };

export function SubmitButton({
  pendingText = "Enviando...",
  children,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} type="submit" disabled={Boolean(disabled) || pending} aria-busy={pending}>
      {pending ? pendingText : children}
    </Button>
  );
}
