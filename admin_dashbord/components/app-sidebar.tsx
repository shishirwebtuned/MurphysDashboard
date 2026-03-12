"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  PieChart,
  Settings2,
  SquareTerminal,
  LayoutDashboard,
  Briefcase,
  Grid3x3,
  CreditCard,
  Search,
  ShoppingBasketIcon,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,  
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import Image from "next/image"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Users",
      url: "#",
      icon: SquareTerminal,
      items: [
        {
          title: "Invite Users",
          url: "/admin/invte_users",
        },

        {
          title: "All users",
          url: "/admin/get_all_users",
        },
        {
          title: "Admin Users",
          url: "/admin/admin_users",
        },
        {
          title: "Clients Users",
          url: "/admin/clients_users",
        },
      ],
    },

    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Site Settings",
          url: "/admin/settings",
        },
        {
          title: "Change Password",
          url: "/admin/change_password",
        },
        {
          title: "Privacy Policy",
          url: "/admin/privacy_policy",
        },
        {
          title: "Terms and Conditions",
          url: "/admin/termandcondation",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Profile",
      url: "/admin/profile",
      icon: PieChart,
    },
    {
      name: "Services",
      url: "/admin/services",
      icon: Briefcase,
    },
    {
      name: "Categories",
      url: "/admin/categories",
      icon: Grid3x3,
    },

    {
      name: "Assigned Services",
      url: "/admin/view_assign_service",
      icon: AudioWaveform,
    },
    // {
    //   name: "Role and Permission",
    //   url: "/admin/roles",
    //   icon: Map,
    // },
    {
      name: "Cart",
      url: "/admin/cart",
      icon: ShoppingBasketIcon,
    },
    {
      name: "Payment History",
      url: "/admin/paymenthistory",
      icon: CreditCard,
    },
    {
      name: "Open Tickets",

        icon: BookOpen,
      url: "/admin/tickets",
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  // Filter projects based on search
  const filteredProjects = React.useMemo(() => {
    if (!searchQuery) return data.projects
    return data.projects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  // Filter nav items based on search
  const filteredNavMain = React.useMemo(() => {
    if (!searchQuery) return data.navMain
    return data.navMain.map(item => ({
      ...item,
      items: item.items?.filter(subItem =>
        subItem.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(item => item.items && item.items.length > 0)
  }, [searchQuery])

  return (
    <Sidebar collapsible="icon" {...props} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
  

      {/* Fixed Header */}
      <SidebarHeader className="bg-white dark:bg-slate-900/50 backdrop-blur-xl pb-4">
        <motion.div
          className="flex h-14 items-center px-4 pt-2"
          animate={{
            justifyContent: isCollapsed ? "center" : "flex-start"
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isCollapsed ? "collapsed" : "expanded"}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex items-center"
            >
              {isCollapsed ? (
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-gray-900 to-violet-600 dark:from-white dark:to-violet-400 bg-clip-text text-transparent select-none">
                  MT
                </span>
              ) : (
                <Image
                  src="/logo.png"
                  alt="Murphys Logo"
                  width={130}
                  height={40}
                  className="object-contain"
                  priority
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="px-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="relative group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-700 dark:text-white/70 group-hover:text-slate-900 dark:group-hover:text-white transition-colors pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search navigation..."
                  className="h-9 pl-9 transition-all  dark:text-white text-slate-900 rounded-lg text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isCollapsed && (
          <motion.div
            className="px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.2 }}
          >
            <div className="relative flex justify-center py-2">
              <Search className="h-5 w-5 text-slate-700 dark:text-white/70 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" />
            </div>
          </motion.div>
        )}
      </SidebarHeader>

      {/* Scrollable Content */}
      <SidebarContent className="overflow-y-auto custom-scrollbar flex-1 px-2 py-4">
        <AnimatePresence mode="wait">
          {filteredProjects.length === 0 && filteredNavMain.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-8 px-4 text-center"
            >
              <Search className="h-12 w-12 text-slate-600 dark:text-white/40 mb-3" />
              <p className="text-sm font-medium text-slate-800 dark:text-white/80">No navigation items found</p>
              <p className="text-xs text-slate-700 dark:text-white/60 mt-1">Try a different search term</p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <NavProjects projects={filteredProjects} />
              <NavMain items={filteredNavMain} />
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarContent>

      {/* Fixed Footer */}
      <SidebarFooter className="bg-white dark:bg-slate-900/50 p-2 mt-auto border-t border-slate-200 dark:border-slate-700">
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}