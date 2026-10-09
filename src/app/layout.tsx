import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorker } from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "Dead Signal",
  description: "A murder mystery you solve through the crime scene and the victim's phone.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "Dead Signal", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0d0d10",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
