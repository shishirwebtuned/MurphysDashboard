"use client"
import React, { useState } from 'react'
import { useAppDispatch } from '@/lib/redux/hooks'
import { toggleUserPermission } from '@/lib/redux/slices/permissionSlice'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface PermissionSwitchProps {
  userId: string
  permission: string
  initialState: boolean
  label: string
  onToggle?: (newState: boolean) => void
}

export default function PermissionSwitch({ userId, permission, initialState, label, onToggle }: PermissionSwitchProps) {
  const dispatch = useAppDispatch()
  const [isEnabled, setIsEnabled] = useState(initialState)
  const [isToggling, setIsToggling] = useState(false)

  const handleToggle = async () => {
    setIsToggling(true)
    try {
      await dispatch(toggleUserPermission({ userId, permission })).unwrap()
      const newState = !isEnabled
      setIsEnabled(newState)
      toast.success(`${label} permission ${newState ? 'granted' : 'revoked'}`)
      if (onToggle) onToggle(newState)
    } catch (error: any) {
      toast.error(error || 'Failed to toggle permission')
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id={`${userId}-${permission}`}
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={isToggling}
      />
      <Label
        htmlFor={`${userId}-${permission}`}
        className="text-sm font-normal cursor-pointer"
      >
        {label}
      </Label>
    </div>
  )
}
