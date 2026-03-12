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
  // normalize trailing slashes for matching
  const normalize = (u?: string) => (u || '').replace(/\/+$|(?<!^)\/$/, '')
  const pathnameNormalized = pathname ? pathname.replace(/\/+$|(?<!^)\/$/, '') : ''

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold text-slate-800 dark:text-white/70 uppercase tracking-wider px-2 mb-2">
        Management
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
                    className="h-9 text-slate-900 dark:text-white hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-lg data-[active=true]:bg-white/20 data-[active=true]:text-slate-900 dark:data-[active=true]:text-white data-[state=open]:text-slate-900 dark:data-[state=open]:text-white font-medium data-[active=true]:ring-0 data-[active=true]:shadow-none ring-0 shadow-none"
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span className="flex-1">{item.title}</span>
                    <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-slate-700 dark:text-white/50 group-hover/collapsible:text-slate-900 dark:group-hover/collapsible:text-white" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="mr-0 border-l border-slate-700 dark:border-white/20 ml-3.5 pl-3 mt-1 space-y-0.5 transition-all">
                    {item.items?.map((subItem) => {
                      const subUrl = normalize(subItem.url)
                      const subIsActive = !!subItem.url && (pathnameNormalized === subUrl || pathnameNormalized.startsWith(subUrl + '/'))
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={subIsActive}
                            className="h-8 text-slate-800 dark:text-white/80 hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-md data-[active=true]:bg-white/20 data-[active=true]:text-slate-900 dark:data-[active=true]:text-white data-[active=true]:font-medium data-[active=true]:ring-0 data-[active=true]:shadow-none ring-0 shadow-none"
                          >
                            <Link href={subItem.url}>
                              <span className="text-sm">{subItem.title}</span>
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
