import "./globals.css";
import App from "@/app/App";
import "@/app/globalIcons.css";
import type { Metadata } from "next";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Supabase Client Side SSO",
  description: "Supabase Client Side SSO Template",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} antialiased`}>
        <App>
          {children}
        </App>
      </body>
    </html>
  );
}