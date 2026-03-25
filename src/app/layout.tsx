import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AuditShield — Food Safety Log",
  description: "Food Safety SaaS Kiosk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} font-sans antialiased bg-[#f5f4f0] text-[#111110] min-h-screen flex flex-col items-center pt-8 sm:pt-16 pb-8 px-4`}
      >
        {children}
      </body>
    </html>
  );
}
