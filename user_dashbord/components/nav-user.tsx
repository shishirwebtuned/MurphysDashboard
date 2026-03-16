"use client"

import {
  LogOut,
  Settings,
  User,
  Shield,
  Trash,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { getMee } from "@/lib/redux/slices/meeSlice"
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

export function NavUser({ showFull = false, dropUp = true }: { showFull?: boolean; dropUp?: boolean }) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const mee = useAppSelector((state) => state.mee.data)

  useEffect(() => {
    if (!mee) dispatch(getMee())
  }, [dispatch, mee])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const profile = mee?.profile ?? mee
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  }

  const userName = profile?.firstName || profile?.lastName
    ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
    : profile?.name || 'User'
  const userEmail = profile?.email || mee?.email || 'Not available'
  const userAvatar = profile?.profile_image || ""
  const userRole = profile?.role_type || "User"

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    router.push('/login')
  }

  return (
    <div className="relative w-full p-2" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full gap-3 p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/10 text-left"
      >
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-slate-200 dark:border-white/30 bg-slate-100 dark:bg-white/10 flex items-center justify-center">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-bold">{getInitials(userName)}</span>
          )}
        </div>
        <div className={showFull ? "block flex-1 min-w-0" : "hidden md:block flex-1 min-w-0"}>
          <p className="text-sm font-medium truncate text-slate-900 dark:text-white">{userName}</p>
          <p className="text-xs truncate text-slate-500 dark:text-slate-400">{userEmail}</p>
        </div>

      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute ${dropUp ? 'bottom-full mb-2 slide-in-from-bottom-2' : 'top-full mt-2 slide-in-from-top-2'} left-0 right-0 sm:left-auto sm:right-0 sm:w-64 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl z-[9999] overflow-hidden animate-in fade-in duration-200`}>
          {/* Header */}
          <div className="p-3 sm:p-4 flex items-center gap-3 border-b border-slate-100 dark:border-white/5">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center overflow-hidden">
              {userAvatar ? <img src={userAvatar} alt={userName} /> : getInitials(userName)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-semibold truncate">{userName}</span>
              <span className="text-[10px] sm:text-xs text-slate-500 truncate">{userEmail}</span>
              <span className="mt-1 flex items-center gap-1 px-2 py-0.5 w-fit rounded-full bg-slate-100 dark:bg-white/10 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                <Shield className="h-3 w-3" /> {userRole}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-1 sm:p-1.5">
            <button
              onClick={() => { router.push('/user/profile'); setIsOpen(false); }}
              className="flex items-center w-full gap-3 px-2 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-md hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <User className="h-4 w-4" /> My Profile
            </button>
            <button
              onClick={() => { router.push('/user/change_password'); setIsOpen(false); }}
              className="flex items-center w-full gap-3 px-2 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-md hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <Settings className="h-4 w-4" /> Change Password
            </button>

            <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />

            <button
              onClick={() => { setShowLogoutDialog(true); setIsOpen(false); }}
              className="flex items-center w-full gap-3 px-2 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/10"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
            <Link href="/user/delete_account" className="flex items-center w-full gap-3 px-2 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/10">
              <Trash className="h-4 w-4" /> Delete Account
            </Link>
          </div>
        </div>
      )}

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will log you out of your current session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}