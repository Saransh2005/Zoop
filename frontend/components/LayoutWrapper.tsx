"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMeetingPage = pathname?.startsWith("/meeting/");

  if (isMeetingPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: 52, flex: 1 }}>
        {children}
      </div>
      <Footer />
    </>
  );
}
