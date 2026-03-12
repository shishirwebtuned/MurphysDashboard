'use client'
import React, { useEffect } from 'react'
import axiosInstance from '@/lib/axios'
import { getMee } from '@/lib/redux/slices/meeSlice'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { useRouter } from 'next/navigation'

const Page = () => {
    const dispatch = useAppDispatch()
    const router = useRouter()
    const mee = useAppSelector((state) => state?.mee)
    const email = mee.data?.email

    useEffect(() => {
        dispatch(getMee())
    }, [dispatch])

    const getProfile = async () => {
        try {
            const response = await axiosInstance.get(`/profiles/`, {
                params: { email },
            
            })
            console.log('Profile data:', response.data)

            const roleType = response.data?.data?.role_type
            console.log('User role type:', roleType)
            
            // Check if user has admin user role
            if (roleType !== 'admin user') {
                console.log('Access denied: User is not an admin user')
                router.push('/login') // Redirect non-admin users to login
                return
            }

            const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
            // Only navigate to /admin/dashboard when not already under any /admin route
            if (!currentPath.startsWith('/admin')) {
                router.push('/admin/dashboard')
            }
        } catch (error: any) {
            console.error('Error fetching profile data:', error)
            if (error?.response?.status === 404) {
                router.push('/profile')
            }
        }
    }

    useEffect(() => {
        if (email) getProfile()
    }, [email])

    return null
}

export default Page