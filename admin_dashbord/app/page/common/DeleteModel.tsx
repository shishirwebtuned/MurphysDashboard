import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';

type DeleteModelProps = {
    // simple usage
    onsuccess?: () => void | Promise<void>;
    deleteId?: string | number | null;
    // controlled / enhanced usage
    isOpen?: boolean;
    onClose?: () => void;
    title?: string;
    description?: string;
    onConfirm?: () => void | Promise<void>;
}

function DeleteModel({ onsuccess, deleteId, isOpen, onClose, title, description, onConfirm }: DeleteModelProps) {
    const [open, setOpen] = React.useState<boolean>(isOpen ?? !!deleteId);

    // keep internal open state in sync with controlled prop if provided
    React.useEffect(() => {
        if (typeof isOpen === 'boolean') {
            setOpen(isOpen);
        } else {
            setOpen(!!deleteId);
        }
    }, [isOpen, deleteId]);

    const handleCancel = () => {
        if (typeof onClose === 'function') onClose();
        setOpen(false);
    };

    const handleDelete = async () => {
        try {
            if (typeof onConfirm === 'function') {
                await onConfirm();
            } else if (typeof onsuccess === 'function') {
                await onsuccess();
            }
        } catch (err) {
            // swallow here; caller should handle errors in onConfirm/onsuccess
        } finally {
            if (typeof onClose === 'function') onClose();
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v && typeof onClose === 'function') onClose(); }}>
            <DialogTrigger asChild>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title ?? 'Delete'}</DialogTitle>
                    <DialogDescription>
                        {description ?? 'Are you sure you want to delete this item? This action cannot be undone.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 flex justify-end gap-2">
                    <Button  variant="secondary" onClick={handleCancel}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteModel