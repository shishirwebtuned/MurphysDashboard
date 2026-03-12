"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { usePathname } from 'next/navigation'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname();
  const normalize = (u?: string) => (u || '').replace(/\/+$|(?<!^)\/$/, '')
  const pathnameNormalized = pathname ? pathname.replace(/\/+$|(?<!^)\/$/, '') : ''
  // detect dark mode to avoid overriding dark styles with inline styles
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark')

  return (
    <SidebarGroup className="">
      <SidebarGroupLabel className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 mb-2">
        Account Management
      </SidebarGroupLabel>
      <SidebarMenu className="space-y-1">
        {items.map((item) => {
          const itemUrl = normalize(item.url)
          const itemIsActive = !!item.isActive || (!!item.url && item.url !== '#' && (
            pathnameNormalized === itemUrl || pathnameNormalized.startsWith(itemUrl + '/')
          )) || (item.items || []).some(sub => {
            const subUrl = normalize(sub.url)
            return !!sub.url && (pathnameNormalized === subUrl || pathnameNormalized.startsWith(subUrl + '/'))
          })

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={itemIsActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={itemIsActive}
                    // inline style for light mode active visibility
                    style={itemIsActive && !isDark ? { backgroundColor: '#eff6ff', color: '#1e40af' } : undefined}
                    className={`h-9 transition-all ${
                      itemIsActive 
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-primary/10 dark:text-primary dark:hover:bg-primary/20 font-semibold' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    {item.icon && <item.icon className={`h-4 w-4 ${
                      itemIsActive ? 'text-blue-600 dark:text-primary' : 'text-muted-foreground'
                    }`} />}
                    <span className="flex-1">{item.title}</span>
                    <ChevronRight className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 ${
                      itemIsActive ? 'text-blue-600 dark:text-primary' : 'text-muted-foreground'
                    }`} />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mr-0 border-l border-slate-200 dark:border-slate-800 ml-3.5 pl-3 mt-1 space-y-0.5">
                    {item.items?.map((subItem) => {
                      const subUrl = normalize(subItem.url)
                      const subIsActive = !!subItem.url && (pathnameNormalized === subUrl || pathnameNormalized.startsWith(subUrl + '/'))
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={subIsActive}
                            // inline style ensures sub-item active is visible in light mode
                            style={subIsActive && !isDark ? { backgroundColor: '#3b82f6', color: '#ffffff' } : undefined}
                            className={`h-8 transition-all ${
                              subIsActive 
                                ? 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 font-semibold' 
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <Link href={subItem.url}>
                              <span className={`text-sm ${
                                subIsActive 
                                  ? 'text-white dark:text-primary-foreground font-medium' 
                                  : 'text-slate-900 dark:text-white'
                              }`}>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
