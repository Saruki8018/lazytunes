import { X } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";

/** Renders app-wide toast notifications (bottom-center) */
export function ToastNotifications() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 rounded-lg bg-foreground px-4 py-2.5 text-sm text-background shadow-lg"
        >
          <span>{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
