import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Toaster } from "@/components/ui/sonner";

export type SiteNoticeKind = "success" | "error" | "warning" | "info";

type NoticeOptions = {
  description?: string;
  kind?: SiteNoticeKind;
};

type ConfirmOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  description?: string;
};

type ConfirmRequest = {
  message: string;
  options: ConfirmOptions;
  resolve: (accepted: boolean) => void;
};

type FeedbackEvent = {
  type: "confirm";
  request: ConfirmRequest;
};

const subscribers = new Set<(event: FeedbackEvent) => void>();
const pendingEvents: FeedbackEvent[] = [];

function emit(event: FeedbackEvent) {
  if (subscribers.size === 0) {
    pendingEvents.push(event);
    return;
  }

  subscribers.forEach((subscriber) => subscriber(event));
}

/** Displays an in-app notification without using browser dialogs. */
export function notifySite(message: string, options: NoticeOptions = {}) {
  const { description, kind = "info" } = options;
  const toastOptions = description ? { description } : undefined;

  if (kind === "success") toast.success(message, toastOptions);
  else if (kind === "error") toast.error(message, toastOptions);
  else if (kind === "warning") toast.warning(message, toastOptions);
  else toast.info(message, toastOptions);
}

/** Opens an accessible in-app confirmation dialog. */
export function confirmSite(message: string, options: ConfirmOptions = {}) {
  return new Promise<boolean>((resolve) => {
    emit({ type: "confirm", request: { message, options, resolve } });
  });
}

export function SiteFeedbackProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ConfirmRequest[]>([]);
  const currentRequest = requests[0];

  useEffect(() => {
    const subscriber = (event: FeedbackEvent) => {
      setRequests((current) => [...current, event.request]);
    };

    subscribers.add(subscriber);
    if (pendingEvents.length > 0) {
      const queued = pendingEvents.splice(0, pendingEvents.length);
      queued.forEach(subscriber);
    }

    return () => {
      subscribers.delete(subscriber);
    };
  }, []);

  function resolveCurrent(accepted: boolean) {
    if (!currentRequest) return;
    currentRequest.resolve(accepted);
    setRequests((current) => current.slice(1));
  }

  return (
    <>
      {children}
      <Toaster position="top-right" closeButton richColors />
      <AlertDialog
        open={Boolean(currentRequest)}
        onOpenChange={(open) => {
          if (!open) resolveCurrent(false);
        }}
      >
        <AlertDialogContent aria-describedby="site-confirmation-description">
          <AlertDialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-ae2v-red/10 text-ae2v-red">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </div>
            <AlertDialogTitle>
              {currentRequest?.options.title ?? "Confirmer cette action"}
            </AlertDialogTitle>
            <AlertDialogDescription id="site-confirmation-description">
              {currentRequest?.message}
              {currentRequest?.options.description ? (
                <span className="mt-2 block">{currentRequest.options.description}</span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => resolveCurrent(false)}>
              {currentRequest?.options.cancelLabel ?? "Annuler"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => resolveCurrent(true)}>
              {currentRequest?.options.confirmLabel ?? "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
