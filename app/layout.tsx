import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-mono/700.css";
import { AppShell } from "@/components/app-shell";
import { WorkspaceProvider } from "@/components/workspace-provider";
import { backendMode } from "@/lib/runtime";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Prompt Inbox", template: "%s | Prompt Inbox" },
  description:
    "A personal library for your most useful prompts. Capture, organize, find, and reuse.",
  robots: { index: false, follow: false },
};

// The backend mode is resolved from runtime env, so the shell must not be frozen at build time.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  const mode = backendMode();
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <Suspense
          fallback={
            <div className="flex min-h-dvh items-center justify-center text-sm text-muted">
              Loading workspace...
            </div>
          }
        >
          <WorkspaceProvider mode={mode}>
            <AppShell>{children}</AppShell>
          </WorkspaceProvider>
        </Suspense>
      </body>
    </html>
  );
}
