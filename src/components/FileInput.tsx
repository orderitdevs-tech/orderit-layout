"use client";

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';

interface FileInputProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    disabled?: boolean;
    children: React.ReactNode;
}

export function FileInput({ onFileSelect, accept = '.json', disabled, children }: FileInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
        // Reset the input to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <Button
                onClick={handleClick}
                disabled={disabled}
                variant="outline"
                className="w-full h-9 hover:bg-orange-50 border-orange-200 text-orange-700 transition-all duration-200"
            >
                {children}
            </Button>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled}
            />
        </>
    );
}