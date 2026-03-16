'use client'
import React, { useEffect } from 'react'
import axiosInstance from '@/lib/axios'
import { getMee } from '@/lib/redux/slices/meeSlice'
import { setProfile } from '@/lib/redux/slices/profileSlice'
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

            // Store profile data in Redux
            const profileData = response.data?.data || response.data
            if (profileData) {
                dispatch(setProfile(profileData))
            }

            const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
            // Only navigate to /user/dashboard when not already under any /user route
            if (!currentPath.startsWith('/user')) {
                router.push('/user/dashboard')
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