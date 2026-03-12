import type { Metadata } from "next";
import NextThemeProvider from "@/components/NextThemeProvider";
import Page from "../admin/page";

import Sidebar from "@/app/page/Appsidebar";
import { ReduxProvider } from "@/app/page/ReduxProvider";

export const metadata: Metadata = {
  title: "Admin Dashboard | Murphy’s",
  description: "Secure toolset for managing digital marketing services and billing at Murphy’s.",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextThemeProvider>
      <ReduxProvider>
        <Sidebar>
          <div className="w-full  bg-muted/5 min-h-screen">
            <Page />
            {children}
          </div>
        </Sidebar>
      </ReduxProvider>
    </NextThemeProvider>
  );
}
