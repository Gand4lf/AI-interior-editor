'use client';

import { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';

interface ImageUploaderProps {
    onImageSelected: (imageUrl: string) => void;
    setIsLoading: (loading: boolean) => void;
}

export default function ImageUploader({ onImageSelected, setIsLoading }: ImageUploaderProps) {
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            await handleFile(file);
        }
    }, []);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await handleFile(file);
        }
    };

    const handleFile = async (file: File) => {
        setIsLoading(true);
        try {
            // Convert file to base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                const base64data = reader.result as string;
                onImageSelected(base64data);
            };
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Error processing image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
                type="file"
                id="image-upload"
                className="hidden"
                accept="image/*"
                onChange={handleChange}
            />
            <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
            >
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600">
                    Drag and drop an image here, or click to select
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    Supported formats: JPG, PNG
                </p>
            </label>
        </div>
    );
} 