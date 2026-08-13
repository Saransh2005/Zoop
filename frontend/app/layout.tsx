import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zoop — Video Conferencing & Real-Time Meetings",
  description:
    "Zoop provides secure, high-definition video conferencing, screen sharing, and real-time collaboration.",
  keywords: "zoop, video conferencing, meetings, webinars, online collaboration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ paddingTop: 52, flex: 1 }}>
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
