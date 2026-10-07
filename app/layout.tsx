import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GCScrape",
  description: "Google Classroom assignment dashboard"
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
