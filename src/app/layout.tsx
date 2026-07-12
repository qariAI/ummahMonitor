import type { Metadata } from "next";
import "./globals.css";
import "@/styles/components.css";
import { Providers } from "@/components/Providers";
import { GlobalBriefButton } from "@/components/GlobalBriefButton";

export const metadata: Metadata = {
  title: "UmmahMonitor — live situational awareness for the Ummah",
  description:
    "What happened, what is the verified current status, and how the Ummah can respond.",
};

// Read persisted theme before first paint to avoid a flash (README interactions).
const themeScript = `(function(){try{var t=localStorage.getItem('um-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <GlobalBriefButton />
      </body>
    </html>
  );
}
