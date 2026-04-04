// app/layout.tsx - Server Component
import { Geist } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/client-providers";
// Base URL configuration for metadata
const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

// Metadata configuration
export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "University Management System",
  description: "Manage batches, students, teachers, courses, and fees.",
};

// Font configuration
const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistSans.className}`}
      suppressHydrationWarning
    >
    
      <head />
      <body 
        className="bg-background text-foreground antialiased"
        suppressHydrationWarning={true} 
      >

        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}