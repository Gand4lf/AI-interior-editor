'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { Chrome } from 'lucide-react';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface AuthDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthDialog({ isOpen, onClose }: AuthDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        try {
            setIsLoading(true);
            await signInWithPopup(auth, provider);
            console.log('User signed in');
        } catch (error) {
            console.error('Error signing in:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Continue with AIchitect</DialogTitle>
                    <DialogDescription>
                        Sign in to save your designs and continue creating amazing images.
                        Your first 3 generations are free!
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Button
                        variant="outline"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full"
                    >
                        <Chrome className="w-5 h-5 mr-2" />
                        Continue with Google
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
