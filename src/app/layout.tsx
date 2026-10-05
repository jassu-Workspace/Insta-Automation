import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DMflow — Instagram Business Automation Dashboard",
  description: "Automate DMs, comments, and lead qualification for Instagram Professional & Business accounts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div style={{ position: "relative", minHeight: "100vh" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
