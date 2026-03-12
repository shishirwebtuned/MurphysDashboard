"use client"

import {
  BadgeCheck,
  Bell,
  CreditCard,
  LogOut,
  Settings,
  User,
  Shield,
  Trash,

} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,

} from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState, useRef } from "react"
import { fetchProfileByEmail } from "@/lib/redux/slices/profileSlice"
import { getMee } from "@/lib/redux/slices/meeSlice"
import Link from "next/link"

export function NavUser({ showFull = false, dropUp = true }: { showFull?: boolean; dropUp?: boolean }) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const meeState = useAppSelector((state) => state.mee)
  console.log("meeState:", meeState)
  const dispatch = useAppDispatch()

  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])



  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  const handleLogout = async () => {
    try {
      // Clear authentication data from localStorage (backend auth)
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    // Get the current user info from backend
    if (!meeState.data) {
      dispatch(getMee())
    }
  }, [dispatch, meeState.data])
  const userAvatar = meeState.data?.profile_image || ""
  const userName = meeState.data?.firstName && meeState.data?.lastName
    ? `${meeState.data.firstName} ${meeState.data.lastName}`.trim()
    : meeState.data?.name || "User"
  const userEmail = meeState.data?.email || "Not available"
  const userRole = meeState.data?.role_type || "User"


  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="relative" ref={dropdownRef}>
            <SidebarMenuButton
              size="lg"
              className="h-12 text-slate-900 dark:text-white hover:bg-white/10 transition-colors rounded-lg cursor-pointer"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <Avatar className="h-9 w-9 rounded-full border-2 border-slate-700 dark:border-white/30">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="rounded-full bg-white/20 text-slate-900 dark:text-white font-semibold">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className={showFull ? "grid flex-1 text-left text-sm leading-tight" : "hidden md:grid flex-1 text-left text-sm leading-tight"}>
                <span className="truncate font-medium text-slate-900 dark:text-white">{userName}</span>
                <span className="truncate text-xs text-slate-700 dark:text-white/70">{userEmail}</span>
              </div>
            </SidebarMenuButton>

            {/* Custom Dropdown Menu */}
            {dropdownOpen && (
              <div 
                className={`absolute ${dropUp ? 'bottom-full mb-2 slide-in-from-bottom-2' : 'top-full mt-2 slide-in-from-top-2'} left-0 right-0 sm:left-auto sm:right-0 sm:w-64 w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-[9999] animate-in fade-in duration-200`}
                style={{
                  maxHeight: 'calc(100vh - 100px)',
                  overflowY: 'auto'
                }}
              >
                {/* User Info Header */}
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-gray-300 dark:border-gray-600">
                      <AvatarImage src={userAvatar} alt={userName} />
                      <AvatarFallback className="rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-400 font-semibold text-lg">
                        {getInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{userName}</span>
                      <span className="truncate text-xs sm:text-sm text-gray-600 dark:text-gray-400">{userEmail}</span>
                      <Badge variant="secondary" className="mt-1.5 w-fit text-[10px] sm:text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        <Shield className="h-3 w-3 mr-1" />
                        {userRole}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-1 sm:p-1.5">
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      router.push('/admin/profile')
                    }}
                    className="flex items-center w-full px-2 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span>My Profile</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      router.push('/admin/settings')
                    }}
                    className="flex items-center w-full px-2 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Settings</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      router.push('/admin/change_password')
                    }}
                    className="flex items-center w-full px-2 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Change Password</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                {/* Logout */}
                <div className="p-1 sm:p-1.5">
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      setShowLogoutDialog(true)
                    }}
                    className="flex items-center w-full px-2 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently log you out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Log out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
