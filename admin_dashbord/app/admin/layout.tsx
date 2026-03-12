import type { Metadata } from "next";
import NextThemeProvider from "@/components/NextThemeProvider";
import Page from "../admin/page";

import Sidebar from "@/app/page/Appsidebar";
import { ReduxProvider } from "@/app/page/ReduxProvider";

export const metadata: Metadata = {
  title: "Management Console | Murphy’s",
  description: "Enterprise administration portal for handling business logic.",
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
