import type { ReactNode } from "react";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function BureauModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "grid max-w-4xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 border-2 border-ae2v-black bg-card p-0 [&>button]:text-white",
          className,
        )}
      >
        <DialogHeader className="border-b-2 border-ae2v-black bg-ae2v-black px-5 py-4 text-white sm:px-6">
          <DialogTitle className="font-impact text-2xl uppercase tracking-wide text-white">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-left text-xs text-ae2v-offwhite/75">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogBody className="px-4 py-4 sm:px-6">{children}</DialogBody>
        {footer ? (
          <DialogFooter className="border-t-2 border-ae2v-black bg-card px-4 py-3 sm:px-6">
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
