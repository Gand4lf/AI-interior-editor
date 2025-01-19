'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import ImageEditor from './components/ImageEditor';
import { cn } from '@/lib/utils';
import { ConfirmationDialog } from './components/ui/confirmation-dialog';
import { Button } from './components/ui/button';
import type { DesignSession, HistoryEntry } from '../lib/types';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  setSessions,
  addSession,
  removeSession,
  setCurrentSession,
  updateCurrentImage,
  addHistoryEntry,
  resetCount,
  setCount
} from '@/lib/redux/store';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [deleteSession, setDeleteSession] = useState<DesignSession | null>(null);

  const dispatch = useAppDispatch();
  const { sessions, currentSessionId, currentImage, history } = useAppSelector(state => state.session);
  const generationCount = useAppSelector(state => state.generation.count);

  // Create initial session if none exist
  useEffect(() => {
    if (sessions.length === 0 && !currentSessionId) {
      const newSession: DesignSession = {
        id: Date.now().toString(),
        name: 'Design 1',
        timestamp: new Date(),
        lastImage: null,
        history: []
      };

      dispatch(addSession(newSession));
    }
  }, [sessions.length, currentSessionId, dispatch]);

  const createNewSession = async () => {
    // Don't allow creating a new session if current one is empty
    if (currentSessionId && history.length === 0) {
      return;
    }

    // Create new session
    const newSession: DesignSession = {
      id: Date.now().toString(),
      name: `Design ${sessions.length + 1}`,
      timestamp: new Date(),
      lastImage: null,
      history: []
    };

    dispatch(addSession(newSession));
  };

  const handleUpdateHistory = async (newEntry: HistoryEntry) => {
    dispatch(addHistoryEntry(newEntry));
  };

  const handleDeleteSession = (session: DesignSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteSession(session);
  };

  const confirmDelete = async () => {
    if (!deleteSession) return;
    dispatch(removeSession(deleteSession.id));
    setDeleteSession(null);
  };

  return (
    <div className="flex max-h-screen h-screen bg-white">
      {/* Left Sidebar - Chat Sessions */}
      <div className="w-64 border-r border-gray-200 overflow-y-auto bg-neutral-100">
        <div className="p-4">
          <Button
            onClick={createNewSession}
            className={cn(
              "w-full flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors",
              currentSessionId && history.length === 0
                ? "opacity-50 cursor-not-allowed"
                : ""
            )}
            disabled={Boolean(currentSessionId && history.length === 0)}
            title={currentSessionId && history.length === 0 ? "Generate an image in the current design first" : "Start New Design"}
          >
            <Plus className="w-4 h-4" />
            New Design
          </Button>

          <div className="mt-6 space-y-2">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => dispatch(setCurrentSession(session))}
                className={`group relative p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors hover:bg-gray-200 ${currentSessionId === session.id ? 'bg-blue-100' : ''
                  }`}
              >
                <div className="flex items-center gap-3">
                  {session.lastImage ? (
                    <div className="w-10 h-10 relative rounded overflow-hidden">
                      <Image
                        src={session.lastImage}
                        alt={session.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium truncate">{session.name}</p>
                    <p className="text-xs text-gray-500">
                      {session.history.length} versions
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(session, e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete design"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ImageEditor
        currentImage={currentImage}
        history={history}
        onUpdateHistory={handleUpdateHistory}
        onImageChange={(image) => dispatch(updateCurrentImage(image))}
        setIsLoading={setIsLoading}
        generationCount={generationCount}
        setGenerationCount={(count: number) => dispatch(setCount(count))}
      />

      <ConfirmationDialog
        isOpen={!!deleteSession}
        onClose={() => setDeleteSession(null)}
        onConfirm={confirmDelete}
        title="Delete Design"
        message={`Are you sure you want to delete "${deleteSession?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
