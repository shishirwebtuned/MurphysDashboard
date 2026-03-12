'use client'
import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css';
import { quillModules, quillFormats } from '@/lib/quillConfig';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {  Loader2 } from 'lucide-react';
import Header from '@/app/page/common/header';
import type ReactQuillType from 'react-quill-new';

// Dynamically import ReactQuill to avoid "document is not defined" error during SSR
const ReactQuill = dynamic<React.ComponentProps<typeof ReactQuillType>>(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full  animate-pulse flex items-center justify-center border rounded-md text-muted-foreground">Loading Editor...</div>
});

function PrivacyPolicyPage() {
    const [privacyPolicy, setPrivacyPolicy] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchPrivacyPolicy = async () => {
            try {
                const response = await axiosInstance.get('/privacy-policy', {
                    params: {
                        title: "Terms and Conditions"
                    }
                });
                setPrivacyPolicy(response.data.content || '');
            } catch (error) {
                console.error('Error fetching privacy policy:', error);
                toast({
                    title: "Error",
                    description: "Failed to fetch privacy policy. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchPrivacyPolicy();
    }, [toast]);

    const handleSubmit = async () => {
        setIsSaving(true);
        const title = "Terms and Conditions";
        try {
            await axiosInstance.post('/privacy-policy', { title, content: privacyPolicy });
            toast({
                title: "Success",
                description: "Terms and Conditions updated successfully.",
            });
        } catch (error) {
            console.error('Error updating privacy policy:', error);
            toast({
                title: "Error",
                description: "Failed to update privacy policy.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Header
                title="Terms and Conditions"
                description="Manage and update your application's Terms and Conditions content"

            />
            <div className="container mx-auto py-10 px-4 md:px-0 max-w-5xl">
                <div className="min-h-[400px]  rounded-md overflow-hidden ">


                    <div className="min-h-[400px] border rounded-md overflow-hidden ">
                                                {/* Custom Styles for better Quill appearance */}
    <style jsx global>{`
    /* ===== Light Mode (default) ===== */
    .ql-container.ql-snow {
        border: none !important;
        min-height: 400px;
        font-size: 1rem;
        background: #ffffff;
        color: #020817;
    }

    /* Ensure editor text and all descendants use readable color in light mode */
    .ql-container.ql-snow .ql-editor,
    .ql-container.ql-snow .ql-editor * {
        color: #020817 !important;
    }

    .ql-toolbar.ql-snow {
        border: none !important;
        border-bottom: 1px solid #e2e8f0 !important;
        background: #f8fafc;
    }

    .ql-editor.ql-blank::before {
        color: #94a3b8;
    }

    .ql-editor a {
        color: #1d4ed8 !important; /* blue links in light mode */
    }

    /* ===== Dark Mode Overrides ===== */
    .dark .ql-container.ql-snow {
        background: hsl(222.2 84% 4.9%);
        color: hsl(210 40% 98%);
    }

    /* Ensure editor text and descendants are readable in dark mode */
    .dark .ql-container.ql-snow .ql-editor,
    .dark .ql-container.ql-snow .ql-editor * {
        color: hsl(210 40% 98%) !important;
    }

    .dark .ql-toolbar.ql-snow {
        background: hsl(222.2 84% 4.9%);
        border-bottom: 1px solid hsl(217.2 32.6% 17.5%) !important;
    }

    .dark .ql-toolbar .ql-stroke {
        stroke: hsl(210 40% 98%);
    }

    .dark .ql-toolbar .ql-fill {
        fill: hsl(210 40% 98%);
    }

    .dark .ql-toolbar .ql-picker {
        color: hsl(210 40% 98%);
    }

    .dark .ql-toolbar .ql-picker-options {
        background: hsl(222.2 84% 4.9%);
        border: 1px solid hsl(217.2 32.6% 17.5%);
    }

    .dark .ql-editor.ql-blank::before {
        color: hsl(215 20.2% 65.1%);
    }

    .dark .ql-editor a {
        color: hsl(217.2 91.2% 59.8%);
    }
`}</style>

                        <ReactQuill
                            theme="snow"
                            value={privacyPolicy}
                            onChange={setPrivacyPolicy}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Start writing your privacy policy here..."
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleSubmit}
                            disabled={isSaving || isLoading}
                            className="px-8 py-6 rounded-xl transition-all  font-semibold tracking-wide"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                   
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>

                </div>
            </div>
        </>
    )
}

export default PrivacyPolicyPage