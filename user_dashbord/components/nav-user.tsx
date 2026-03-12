"use client"

import {
  ChevronsUpDown,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useEffect, useState } from "react"
import Link from "next/link"
import { getMee } from "@/lib/redux/slices/meeSlice"

export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const dispatch = useAppDispatch()

  const mee = useAppSelector((state) => state.mee.data)   
  useEffect(() => {
    if (!mee) {
      dispatch(getMee())
    }
  }, [dispatch, mee])

  // Support both response shapes: either mee is the profile object or { profile }
  const profile = mee?.profile ?? mee
console.log("Profile data in NavUser:", profile)




  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  const userName = profile?.firstName || profile?.lastName
    ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
    : profile?.name || 'User'
  const userEmail = profile?.email || mee?.email || 'Not available'
  const userAvatar = profile?.profile_image || ""
  const userRole = profile?.role_type || "User"

  useEffect(() => {
    if (!mee && userEmail !== "Not available") {
      dispatch(getMee())
    }
  }, [dispatch, userEmail, mee])

  const [showLogoutDialog, setShowLogoutDialog] = useState(false)


  const handleLogout = async () => {
    try {
      localStorage.removeItem("token")
      localStorage.removeItem("refreshToken")
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
 

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="h-12 text-slate-900 dark:text-white hover:bg-white/10 transition-colors rounded-lg data-[state=open]:bg-white/10"
              >
                <Avatar className="h-9 w-9 rounded-full border-2 border-slate-700 dark:border-white/30">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="rounded-full bg-white/20 text-slate-900 dark:text-white font-semibold">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-slate-900 dark:text-white">{userName}</span>
                  <span className="truncate text-xs text-slate-700 dark:text-white/70">{userEmail}</span>
                </div>
                <ChevronsUpDown className="ml-auto h-4 w-4 text-slate-700 dark:text-white/70" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 rounded-xl shadow-lg border"
              side="bottom"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="p-3 font-normal">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 rounded-full border-2 border-border">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-lg">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate font-semibold text-sm">{userName}</span>
                    <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                    <Badge variant="secondary" className="mt-1.5 w-fit text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {userRole}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push('/admin/profile')} className="cursor-pointer py-2.5 flex items-center">
                  <div className="h-7 w-7 aspect-square shrink-0 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mr-2">
                    <User className="h-4 w-4 text-slate-700 dark:text-white/70" />
                  </div>
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin/change_password')} className="cursor-pointer py-2.5 flex items-center">
                  <div className="h-7 w-7 aspect-square shrink-0 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mr-2">
                    <Settings className="h-4 w-4 text-slate-700 dark:text-white/70" />
                  </div>
                  <span>Change Password</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="cursor-pointer text-destructive focus:text-destructive py-2.5 flex items-center">
                <div className="h-7 w-7 aspect-square shrink-0 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mr-2">
                  <LogOut className="h-4 w-4 text-slate-700 dark:text-white/70" />
                </div>
                <span>Log out</span>
              </DropdownMenuItem>
              <Link href="/admin/delete_account">
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive py-2.5 flex items-center">
                  <div className="h-7 w-7 aspect-square shrink-0 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mr-2">
                    <Trash className="h-4 w-4 text-slate-700 dark:text-white/70" />
                  </div>
                  <span>Delete Account</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
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