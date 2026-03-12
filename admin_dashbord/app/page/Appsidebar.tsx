"use client"
import { AppSidebar } from "@/components/app-sidebar"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { Separator } from "@/components/ui/separator"
import { NavUser } from "@/components/nav-user"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {  Bell} from "lucide-react"
import {useEffect} from "react"
import { useAppDispatch ,useAppSelector } from '@/lib/redux/hooks'
import { fetchNotices } from "@/lib/redux/slices/noticSlicer"


interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const pathname = usePathname()
  const pathSegments = pathname.split('/').filter(Boolean)
  const currentPage = pathSegments[pathSegments.length - 1]
  const formattedPage = currentPage ? currentPage.charAt(0).toUpperCase() + currentPage.slice(1) : 'Dashboard'
const data = {
  user: {
    name: "",
    email: "",
    avatar: "/avatars/shadcn.jpg",
    
  },
 
}
  const dispatch = useAppDispatch();
  const { notices ,unreadCount } = useAppSelector((state) => state.notices);

  useEffect(() => {
    if(!notices || notices.length===0){
      dispatch(fetchNotices({ page: 1, limit: 1 }));
    }
 
      
  }, [dispatch]);
  
  return (
    <SidebarProvider> 
      <div className=" ">
      <AppSidebar  />
      </div>
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-background flex mb-4 h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-4 justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile toggle */}
            <SidebarTrigger className="block md:hidden -ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{formattedPage}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">

<Link
  href="/admin/notifications"
  className="relative inline-flex items-center"
>
  {/* Bell Icon */}
  <Bell className="h-5 w-5 cursor-pointer transition-colors duration-200 hover:text-blue-600" />

  {/* Unread Count Badge */}
  {unreadCount > 0 && (
    <span
      className="
        absolute -top-1 -right-1
        flex  
        items-center justify-center
        rounded-full
      text-red-900
      bg-red-500
      h-4
      w-4
      
        text-[10px]
        font-bold
        
      "
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  )}
</Link>

                <NavUser />
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
