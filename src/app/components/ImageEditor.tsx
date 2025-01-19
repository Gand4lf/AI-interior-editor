'use client';

import { useState } from 'react';
import { Brush, Edit3, Clock } from 'lucide-react';
import Image from 'next/image';
import DrawingCanvas from './DrawingCanvas';
import { AIInputWithLoading } from "./ui/ai-input-with-loading";
import ImageUploader from './ImageUploader';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { HistoryEntry } from '@/lib/types';

type EditMode = 'view' | 'draw';

interface ImageEditorProps {
    currentImage: string | null;
    history: HistoryEntry[];
    onUpdateHistory: (newEntry: HistoryEntry) => void;
    onImageChange: (imageUrl: string) => void;
    setIsLoading: (loading: boolean) => void;
}

export default function ImageEditor({
    currentImage,
    history,
    onUpdateHistory,
    onImageChange,
    setIsLoading
}: ImageEditorProps) {
    const [editMode, setEditMode] = useState<EditMode>('view');
    const [maskImage, setMaskImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const generationCount = useSelector((state: RootState) => state.generation.count);

    const handleLogin = async () => {
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            console.log('User signed in');
        } catch (error) {
            console.error('Error signing in:', error);
        }
    };

    const handleSubmit = async (value: string) => {
        if (!value.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            if (generationCount <= 0) {
                handleLogin(); // Prompt user to log in
                return;
            }

            if (!currentImage) {
                const response = await fetch('/api/replicate/generate-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: value,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to generate image');
                }

                const data = await response.json();
                if (!data.imageUrl) {
                    throw new Error('No image URL in response');
                }

                const newEntry = {
                    output: data.imageUrl,
                    prompt: value,
                    timestamp: new Date()
                };

                onUpdateHistory(newEntry);
                onImageChange(data.imageUrl);
                return;
            }

            let imageUrl = currentImage;
            let maskUrl = null;

            if (currentImage.startsWith('data:')) {
                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: currentImage,
                    }),
                });

                if (!uploadResponse.ok) {
                    const error = await uploadResponse.json();
                    throw new Error(error.error || 'Failed to upload image');
                }

                const uploadData = await uploadResponse.json();
                imageUrl = uploadData.url;
                console.log('Image uploaded:', imageUrl);
            }

            if (maskImage) {
                const maskUploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: maskImage,
                    }),
                });

                if (!maskUploadResponse.ok) {
                    throw new Error('Failed to upload mask');
                }

                const maskData = await maskUploadResponse.json();
                maskUrl = maskData.url;
                console.log('Mask uploaded:', maskUrl);
            }

            const response = await fetch('/api/replicate/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: value,
                    image: imageUrl,
                    mask: maskUrl,
                    controlnet: !maskUrl,
                    inpaint: !!maskUrl,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to edit image');
            }

            const data = await response.json();
            console.log('Received response:', data);

            if (!data.imageUrl) {
                throw new Error('No image URL in response');
            }

            const newEntry = {
                output: data.imageUrl,
                prompt: value,
                timestamp: new Date()
            };

            onUpdateHistory(newEntry);
            onImageChange(data.imageUrl);
            setMaskImage(null);
            setEditMode('view');
        } catch (error) {
            console.error('Error editing image:', error);
            setError((error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMaskGenerated = (maskDataUrl: string | null) => {
        setMaskImage(maskDataUrl);
        console.log('Mask generated:', maskDataUrl);
    };

    const isEditingMode = editMode === 'draw';

    const getPromptPlaceholder = () => {
        if (!currentImage) {
            return "Describe the image you want to generate...";
        }
        if (editMode === 'draw') {
            return "Describe what to add or change in the selected areas (e.g., 'Add a modern leather sofa')";
        }
        return "Describe how to modify the entire room (e.g., 'Change the style to industrial')";
    };

    const restoreVersion = (entry: HistoryEntry) => {
        onImageChange(entry.output);
        setEditMode('view');
        setMaskImage(null);
    };

    return (
        <div className="flex flex-1 h-full">
            {error && (
                <div className="absolute bottom-4 right-4 mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            <div className="relative flex-1 flex flex-col">
                <span className="text-xl font-bold absolute top-6 left-6 z-[100]">AIchitect</span>
                <div className="flex-1 p-6 overflow-y-auto items-center justify-center">
                    {currentImage ? (
                        <div className="relative aspect-square w-full max-w-xl mx-auto">
                            <DrawingCanvas
                                imageUrl={currentImage}
                                onMaskGenerated={handleMaskGenerated}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <ImageUploader
                                onImageSelected={onImageChange}
                                setIsLoading={setIsLoading}
                            />
                        </div>
                    )}
                </div>

                <div className="p-6">
                    <div className="max-w-2xl mx-auto">
                        <AIInputWithLoading
                            placeholder={getPromptPlaceholder()}
                            onSubmit={handleSubmit}
                            loadingDuration={3000}
                            minHeight={80}
                            maxHeight={200}
                            autoAnimate={false}
                        />
                    </div>
                </div>
            </div>

            <div className="w-64 border-l border-gray-200 overflow-y-auto">
                <div className="p-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4" />
                        History
                    </h3>
                    <div className="space-y-4">
                        {[...history].reverse().map((entry, index) => (
                            <div
                                key={index}
                                className={`p-2 rounded-lg cursor-pointer border border-transparent hover:border-gray-200  ${currentImage === entry.output ? 'bg-gray-200 hover:bg-gray-300' : 'hover:bg-gray-200'
                                    }  `}
                                onClick={() => restoreVersion(entry)}
                            >
                                <div className="relative aspect-square w-full mb-2">
                                    <Image
                                        src={entry.output}
                                        alt={`Version ${history.length - index}`}
                                        fill
                                        className="object-cover rounded"
                                        unoptimized
                                    />
                                </div>
                                <p className="text-sm font-medium truncate">{entry.prompt}</p>
                                <p className="text-xs text-gray-500">
                                    {entry.timestamp.toLocaleTimeString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}