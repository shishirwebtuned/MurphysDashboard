import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/app/page/ReduxProvider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Montserrat } from 'next/font/google';


const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Murphy’s Dashboard | Digital Marketing & Solutions",
  description: "Secure client portal for managing your digital marketing services, billing, and project progress with Murphy’s.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} antialiased`}
      >
        <ReduxProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
