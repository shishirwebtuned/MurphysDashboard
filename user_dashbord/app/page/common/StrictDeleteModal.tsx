'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Copy, Check } from 'lucide-react'

/* --------------------------------------------
   Copyable Text Component
--------------------------------------------- */
const CopyableText = ({
    displayText,
    clipboardText,
}: {
    displayText: string
    clipboardText: string
}) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(clipboardText)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <span
            onClick={handleCopy}
            className="inline-flex items-center gap-1 font-bold text-foreground cursor-pointer select-all underline underline-offset-4"
            title="Click to copy"
        >
            {displayText}
            {copied ? (
                <Check className="h-4 w-4 text-green-600" />
            ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
            )}
        </span>
    )
}

/* --------------------------------------------
   Props
--------------------------------------------- */
interface StrictDeleteModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title?: string
    description?: string
    confirmTextString: string
    loading?: boolean
}

/* --------------------------------------------
   Strict Delete Modal
--------------------------------------------- */
const StrictDeleteModal: React.FC<StrictDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you absolutely sure?',
    description = 'This action cannot be undone. This will permanently delete the account and remove all associated data.',
    confirmTextString,
    loading = false,
}) => {
    const [inputValue, setInputValue] = useState('')
    const isMatch = inputValue === confirmTextString

    useEffect(() => {
        if (isOpen) setInputValue('')
    }, [isOpen])

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                            This operation is irreversible.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            To confirm, please type{' '}
                            <CopyableText
                                displayText={confirmTextString}
                                clipboardText={confirmTextString.toLowerCase()}
                            // 👆 you can change this to ANYTHING
                            />{' '}
                            below:
                        </p>

                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={confirmTextString}
                            disabled={loading}
                            className="font-mono"
                        />
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={!isMatch || loading}
                        className="w-full sm:w-auto"
                    >
                        {loading ? 'Deleting...' : 'I understand, delete this account'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default StrictDeleteModal
