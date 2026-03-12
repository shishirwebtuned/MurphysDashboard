"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, Image } from 'lucide-react';

interface ImageUploadFieldProps {
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreview: string;
  setImagePreview: (preview: string) => void;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ 
  imageFile, 
  setImageFile, 
  imagePreview, 
  setImagePreview 
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Service Image
      </label>
      
      {!imagePreview ? (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200 ease-in-out
            ${isDragging 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-border hover:border-primary hover:bg-accent/50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className="flex flex-col items-center justify-center gap-3">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center transition-colors
              ${isDragging ? 'bg-primary/10' : 'bg-muted'}
            `}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isDragging ? 'Drop image here' : 'Drag & drop image here'}
              </p>
              <p className="text-xs text-muted-foreground">
                or <span className="text-primary font-medium">browse</span> to choose a file
              </p>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        </div>
      ) : (
        <div className="relative group">
          <div className="relative border-2 border-border rounded-lg overflow-hidden">
            <img 
              src={imagePreview} 
              alt="Service preview" 
              className="w-full h-64 object-contain rounded-lg "
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowseClick();
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
              >
                <Image className="w-4 h-4 mr-2" />
                Change
              </button>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-4"
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </button>
            </div>
          </div>
          
          {/* File info */}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Image className="w-4 h-4" />
            <span className="truncate">{imageFile?.name}</span>
            <span>({((imageFile?.size || 0) / 1024).toFixed(2)} KB)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export { ImageUploadField };
export default ImageUploadField;