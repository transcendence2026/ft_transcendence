interface AuthErrorAlertProps {
  message: string;
}

export default function AuthErrorAlert({ message }: AuthErrorAlertProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-control border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
    >
      {message}
    </div>
  );
}
