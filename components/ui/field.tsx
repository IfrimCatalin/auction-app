import { errorText, helperText, labelBase } from "@/lib/ui-tokens";
import { cn } from "@/lib/cn";

type FieldProps = {
  label: string;
  htmlFor?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function Field({ label, htmlFor, helper, error, required, children, className }: FieldProps) {
  return (
    <div className={cn("block", className)}>
      <label htmlFor={htmlFor} className={labelBase}>
        {label}
        {required ? (
          <span className="ml-0.5 text-accent" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      <div className="mt-0">{children}</div>
      {helper && !error ? <p className={helperText}>{helper}</p> : null}
      {error ? (
        <p className={errorText} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
