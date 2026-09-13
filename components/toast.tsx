"use client";

import { Toaster } from "sonner";

export function WorkspaceToast() {
  return (
    <Toaster
      theme="light"
      position="bottom-center"
      closeButton
      toastOptions={{
        style: {
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "saturate(180%) blur(20px)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
          fontFamily: "var(--system-font)",
          borderRadius: "11px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.16)",
        },
      }}
    />
  );
}
