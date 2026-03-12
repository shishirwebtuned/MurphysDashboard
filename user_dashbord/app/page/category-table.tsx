'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { deleteCategory, toggleCategoryStatus, fetchCategories } from '@/lib/redux/slices/categorySlice';
import { Category } from '@/types/service';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Trash2, ChevronLeft, ChevronRight, Eye, ArrowUpDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SpinnerComponent from './common/Spinner';
import { cn } from '@/lib/utils';

interface CategoryTableProps {
  onEdit: (category: Category) => void;
}

export default function CategoryTable({ onEdit }: CategoryTableProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { categories, loading, page: storePage, limit: storeLimit, total, totalPages } = useAppSelector((state) => state.categories);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(storePage || 1);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedViewCategory, setSelectedViewCategory] = useState<Category | null>(null);

  // Client-side sorting states
  const [sortKey, setSortKey] = useState<keyof Category | null>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch categories when page changes
  useEffect(() => {
    dispatch(fetchCategories({ page: currentPage, limit: storeLimit }));
  }, [dispatch, currentPage, storeLimit]);

  // Client-side sorting logic
  const sortedCategories = React.useMemo(() => {
    if (!sortKey) return categories;

    return [...categories].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (!aValue || !bValue) return 0;

      // String sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Date sorting
      if (aValue as any instanceof Date || bValue as any instanceof Date || sortKey === 'createdAt') {
        return sortOrder === 'asc'
          ? new Date(aValue).getTime() - new Date(bValue).getTime()
          : new Date(bValue).getTime() - new Date(aValue).getTime();
      }

      return 0;
    });
  }, [categories, sortKey, sortOrder]);

  const handleSort = (key: keyof Category) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleToggleStatus = async (_id: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await dispatch(toggleCategoryStatus({ _id, status: newStatus })).unwrap();
      toast({
        title: 'Success',
        description: `Category ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error || 'Failed to toggle category status',
        variant: 'destructive',
      });
      console.error('Failed to toggle status:', error);
    }
  };

  const handleViewClick = (category: Category) => {
    setSelectedViewCategory(category);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (categoryToDelete) {
      try {
        await dispatch(deleteCategory(categoryToDelete)).unwrap();
        toast({
          title: 'Success',
          description: 'Category deleted successfully',
        });
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error || 'Failed to delete category',
          variant: 'destructive',
        });
        console.error('Failed to delete category:', error);
      }
    }
  };

  if (loading && categories.length === 0) return <SpinnerComponent />;

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border-dashed rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
        <p className="text-sm text-muted-foreground">
          Create your first category to get started
        </p>
      </div>
    );
  }

  // Pagination indices (server-driven)
  const effectiveTotalPages = totalPages || Math.ceil((total || 0) / (storeLimit || 10));
  const startIndex = (currentPage - 1) * (storeLimit || 10);
  const endIndex = startIndex + (storeLimit || 10);

  return (
    <>
      <div className="">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Index</TableHead>
              <TableHead
                className="cursor-pointer flex items-center gap-2"
                onClick={() => handleSort('name')}
              >
                Category Name
                <ArrowUpDown
                  className={cn(
                    "h-4 w-4 transition-colors",
                    sortKey === 'name' ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead
                className="cursor-pointer flex items-center gap-2"
                onClick={() => handleSort('createdAt')}
              >
                Created
                <ArrowUpDown
                  className={cn(
                    "h-4 w-4 transition-colors",
                    sortKey === 'createdAt' ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCategories.map((category, index) => (
              <TableRow key={category._id}>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{startIndex + index + 1}</span>
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                        {category.description.split(' ').slice(0, 40).join(' ')}
                        {category.description.length > 40 ? '...' : ''}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{category.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(category.createdAt), { addSuffix: true })}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={category.status === 'active'}
                      onCheckedChange={() => handleToggleStatus(category._id, category.status)}
                      disabled={loading}
                    />
                    <Badge
                      variant={category.status === 'active' ? 'secondary' : 'secondary'}
                      className="capitalize"
                    >
                      {category.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleViewClick(category)}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(category)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(category._id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {effectiveTotalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, total || 0)} of {total || 0} categories
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            {Array.from({ length: effectiveTotalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, effectiveTotalPages))}
              disabled={currentPage === effectiveTotalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Category Details</DialogTitle>
            <DialogDescription>View complete category information</DialogDescription>
          </DialogHeader>
          {selectedViewCategory && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category Name</label>
                  <p className="text-lg font-semibold">{selectedViewCategory.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p>
                    <Badge variant={selectedViewCategory.status === 'active' ? 'default' : 'secondary'}>
                      {selectedViewCategory.status}
                    </Badge>
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-base mt-1">{selectedViewCategory.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category
              and may affect associated services.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
