"use client"

import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { usePathname } from 'next/navigation'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"

export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}) {
  const pathname = usePathname();
  const normalize = (u?: string) => (u || '').replace(/\/+$|(?<!^)\/$/, '')
  const pathnameNormalized = pathname ? pathname.replace(/\/+$|(?<!^)\/$/, '') : ''

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs  font-semibold text-slate-800 dark:text-white/70 uppercase tracking-wider px-2 mb-2">
        Quick Access
      </SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => {
          const itemUrl = normalize(item.url)
          const isActive = !!(item.url && (pathnameNormalized === itemUrl || pathnameNormalized.startsWith(itemUrl + '/')))
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                tooltip={item.name}
                isActive={isActive as any}
                className="text-slate-900 dark:text-white hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all duration-200 data-[active=true]:bg-white/20 data-[active=true]:text-slate-900 dark:data-[active=true]:text-white data-[active=true]:shadow-md rounded-lg"
              >
                <Link href={item.url}>
                  <item.icon className="" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}

      </SidebarMenu>
    </SidebarGroup>
  )
}
