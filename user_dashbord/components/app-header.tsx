"use client"
import * as React from "react"
import { Search, Bell, Settings, Moon, Sun, Menu } from "lucide-react"
import { useTheme } from "next-themes"
import { useAppSelector } from "@/lib/redux/hooks"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NavUser } from "@/components/nav-user"

interface AppHeaderProps {
  onSearchChange?: (value: string) => void
  searchValue?: string
}

export function AppHeader({ onSearchChange, searchValue }: AppHeaderProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { toggleSidebar } = useSidebar()

  const noticesState = useAppSelector((state) => state.notices)
  const unreadCount = noticesState?.unreadCount || 0

  const [showMobileSearch, setShowMobileSearch] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="relative flex h-16 items-center justify-between gap-4 px-4 md:px-6">

        {/* LEFT */}
        <div className="flex items-center gap-2 md:gap-4">

          {/* Sidebar Toggle */}
          <button
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            className="
              grid place-items-center
              h-10 aspect-square
              rounded-full
              border border-slate-200 dark:border-slate-700
              cursor-pointer
            "
          >
            <Menu className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          </button>

          {/* Mobile Search Button */}
          <button
            onClick={() => setShowMobileSearch(true)}
            aria-label="Open search"
            className="
              md:hidden
              grid place-items-center
              h-10 aspect-square
              rounded-full
              border border-slate-200 dark:border-slate-700
              cursor-pointer
            "
          >
            <Search className="h-4 w-4 text-slate-700 dark:text-slate-200" />
          </button>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 px-2">
            <div className="relative w-full max-w-[500px] mx-auto">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search or type command..."
                className="h-11 pl-12 pr-4 border border-slate-200 dark:border-slate-700"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="
              grid place-items-center
              h-10 aspect-square
              rounded-full
              border border-slate-200 dark:border-slate-700
              cursor-pointer
            "
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-white" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700" />
            )}
          </button>

          {/* Notification Button */}
          <button
            onClick={() => router.push("/user/contract_messages")}
            aria-label="Notifications"
            className="
              hidden md:grid
              place-items-center
              relative
              h-10 aspect-square
              rounded-full
              border border-slate-200 dark:border-slate-700
              hover:bg-slate-100 dark:hover:bg-slate-800
              transition-colors
              cursor-pointer
            "
          >
            <Bell className="h-5 w-5 text-slate-700 dark:text-slate-200" />

            {unreadCount > 0 && (
              <span
                className="
                  absolute -top-1 -right-1
                  h-5 w-5
                  rounded-full
                  bg-red-500
                  text-white
                  text-xs
                  grid place-items-center
                "
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Change password"
                className="
                  hidden md:grid
                  place-items-center
                  h-10 aspect-square
                  rounded-full
                  border border-slate-200 dark:border-slate-700
                  cursor-pointer
                "
              >
                <Settings className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={8}>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push("/user/change_password")}
                >
                  Change password
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push("/user/delete_account")}
                >
                  Delete account
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <NavUser showFull={false} dropUp={false} />
        </div>

        {/* Mobile Search Overlay */}
        {showMobileSearch && (
          <div className="absolute left-0 right-0 top-full mt-2 px-4 md:hidden z-40">
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                type="search"
                placeholder="Search..."
                className="h-11 pl-10 pr-12 border border-slate-200 dark:border-slate-700"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
              <button
                onClick={() => setShowMobileSearch(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}