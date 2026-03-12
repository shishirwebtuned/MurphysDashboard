"use client"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { usePathname } from "next/navigation"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { fetchNotices } from "@/lib/redux/slices/noticSlicer"


interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")

  const dispatch = useAppDispatch();
  const { notices } = useAppSelector((state) => state.notices);

  useEffect(() => {
    if (!notices || notices.length === 0) {
      dispatch(fetchNotices({ page: 1, limit: 1, email: '' }));
    }
  }, [dispatch]);

  return (
    <SidebarProvider className=" min-h-screen">
      <div className="">
        <AppSidebar searchQuery={searchQuery} />
      </div>
      <SidebarInset>
        <AppHeader onSearchChange={setSearchQuery} searchValue={searchQuery} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
