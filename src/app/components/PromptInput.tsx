'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface PromptInputProps {
    onImageGenerated: (imageUrl: string) => void;
    setIsLoading: (loading: boolean) => void;
}

export default function PromptInput({ onImageGenerated, setIsLoading }: PromptInputProps) {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/replicate/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    controlnet: false,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate image');
            }

            const data = await response.json();
            onImageGenerated(data.imageUrl);
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Error generating image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your dream room (e.g., 'A modern minimalist living room with large windows, neutral colors, and sleek furniture')"
                className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button
                type="submit"
                disabled={!prompt.trim()}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <Send className="w-4 h-4" />
                Generate Image
            </button>
        </form>
    );
} 