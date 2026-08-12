import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zoom — Video Conferencing and Web Conferencing Service",
  description:
    "Zoom is the leader in modern enterprise video communications, with an easy, reliable cloud platform for video and audio conferencing, chat, and webinars.",
  keywords: "zoom, video conferencing, meetings, webinars, online collaboration",
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
