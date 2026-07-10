"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

// Modal shell: closes on backdrop click and Escape (README cross-cutting).
// Portaled to document.body — nav uses backdrop-filter, which (like filter/
// transform) establishes a containing block for fixed-position descendants,
// so a modal rendered inside it would be clipped to the nav's own box rather
// than the viewport.
export function Modal({
  onClose,
  children,
  wide,
}: {
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body,
  );
}
