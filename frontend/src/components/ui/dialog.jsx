import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props} />
  );
}

function DialogContent({
  className,
  children,
  ...props
}) {
  // Auto-wire aria-describedby and aria-labelledby if not provided
  const childArray = React.Children.toArray(children);
  const descEl = childArray.find(
    (child) => React.isValidElement(child) && child.props?.["data-slot"] === "dialog-description" && child.props?.id
  );
  const titleEl = childArray.find(
    (child) => React.isValidElement(child) && child.props?.["data-slot"] === "dialog-title" && child.props?.id
  );

  const forwardedProps = { ...props };
  if (!forwardedProps["aria-describedby"] && descEl) {
    forwardedProps["aria-describedby"] = descEl.props.id;
  }
  if (!forwardedProps["aria-labelledby"] && titleEl) {
    forwardedProps["aria-labelledby"] = titleEl.props.id;
  }

  // Fallback hidden IDs if still missing
  const fallbackDescId = React.useId();
  const fallbackTitleId = React.useId();
  const needsDescFallback = !forwardedProps["aria-describedby"] && !descEl;
  const needsTitleFallback = !forwardedProps["aria-labelledby"] && !titleEl;
  if (needsDescFallback) {
    forwardedProps["aria-describedby"] = fallbackDescId;
  }
  if (needsTitleFallback) {
    forwardedProps["aria-labelledby"] = fallbackTitleId;
  }

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...forwardedProps}>
        {/* Fallback hidden accessible nodes to satisfy ARIA if consumer omitted them */}
        {needsTitleFallback && (
          <h2 id={fallbackTitleId} data-slot="dialog-title" className="sr-only">Dialog</h2>
        )}
        {needsDescFallback && (
          <p id={fallbackDescId} data-slot="dialog-description" className="sr-only">Dialog content</p>
        )}
        {children}
        <DialogPrimitive.Close
          className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props} />
  );
}

function DialogFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props} />
  );
}

function DialogTitle({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props} />
  );
}

function DialogDescription({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props} />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
