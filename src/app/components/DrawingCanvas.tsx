'use client';

import { useEffect, useRef, useState } from 'react';

interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface DrawingCanvasProps {
    imageUrl: string;
    onMaskGenerated: (maskDataUrl: string | null) => void;
}

export default function DrawingCanvas({ imageUrl, onMaskGenerated }: DrawingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [currentBox, setCurrentBox] = useState<Box | null>(null);
    const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        setCtx(context);

        const img = new Image();
        img.crossOrigin = "anonymous";  // Add this to handle CORS

        img.onload = () => {
            // Set canvas dimensions
            canvas.width = img.width;
            canvas.height = img.height;

            // Clear canvas first
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Draw image immediately
            context.drawImage(img, 0, 0);

            // Force a redraw of boxes if any exist
            if (boxes.length > 0) {
                drawCanvas();
            }
        };

        img.onerror = (error) => {
            console.error('Error loading image:', error);
        };

        img.src = imageUrl;

        // Cleanup
        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [imageUrl]);

    useEffect(() => {
        if (!ctx || !canvasRef.current) return;
        drawCanvas();
    }, [boxes, currentBox]);

    const drawCanvas = () => {
        if (!ctx || !canvasRef.current) return;

        // Clear and redraw image
        const img = new Image();
        img.crossOrigin = "anonymous";  // Add this to handle CORS

        img.onload = () => {
            if (!ctx || !canvasRef.current) return;

            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(img, 0, 0);

            // Draw all boxes
            [...boxes, currentBox].filter(Boolean).forEach((box, index) => {
                if (!box) return;
                ctx.strokeStyle = index === selectedBoxIndex ? '#00ff00' : '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(box.x, box.y, box.width, box.height);
            });

            // Generate mask
            generateMask();
        };

        img.onerror = (error) => {
            console.error('Error loading image in drawCanvas:', error);
        };

        img.src = imageUrl;
    };

    const generateMask = () => {
        if (!canvasRef.current) return;

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvasRef.current.width;
        maskCanvas.height = canvasRef.current.height;
        const maskCtx = maskCanvas.getContext('2d');

        if (maskCtx) {
            // Black background
            maskCtx.fillStyle = 'black';
            maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

            // White boxes
            maskCtx.fillStyle = 'white';
            boxes.forEach(box => {
                maskCtx.fillRect(box.x, box.y, box.width, box.height);
            });

            onMaskGenerated(maskCanvas.toDataURL());
        }
    };

    const getCanvasCoordinates = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };

        return {
            x: (e.clientX - rect.left) * (canvasRef.current!.width / rect.width),
            y: (e.clientY - rect.top) * (canvasRef.current!.height / rect.height)
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const { x, y } = getCanvasCoordinates(e);

        // Check if clicking on existing box
        const clickedBoxIndex = boxes.findIndex(box =>
            x >= box.x && x <= box.x + box.width &&
            y >= box.y && y <= box.y + box.height
        );

        if (clickedBoxIndex !== -1) {
            setSelectedBoxIndex(clickedBoxIndex);
            setIsDragging(true);
            setDragOffset({
                x: x - boxes[clickedBoxIndex].x,
                y: y - boxes[clickedBoxIndex].y
            });
        } else {
            setIsDrawing(true);
            setStartPos({ x, y });
            setSelectedBoxIndex(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing && !isDragging) return;

        const { x, y } = getCanvasCoordinates(e);

        if (isDragging && selectedBoxIndex !== null) {
            // Update box position
            const newBoxes = [...boxes];
            newBoxes[selectedBoxIndex] = {
                ...newBoxes[selectedBoxIndex],
                x: x - dragOffset.x,
                y: y - dragOffset.y
            };
            setBoxes(newBoxes);
        } else if (isDrawing && startPos) {
            // Create/update current box
            setCurrentBox({
                x: Math.min(x, startPos.x),
                y: Math.min(y, startPos.y),
                width: Math.abs(x - startPos.x),
                height: Math.abs(y - startPos.y)
            });
        }
    };

    const handleMouseUp = () => {
        if (isDrawing && currentBox) {
            setBoxes([...boxes, currentBox]);
            setCurrentBox(null);
        }
        setIsDrawing(false);
        setIsDragging(false);
    };

    const removeBox = (index: number) => {
        setBoxes(boxes.filter((_, i) => i !== index));
        setSelectedBoxIndex(null);
    };

    const clearBoxes = () => {
        setBoxes([]);
        setCurrentBox(null);
        setSelectedBoxIndex(null);
        onMaskGenerated(null);
    };

    return (
        <div className="relative">
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full h-full cursor-crosshair rounded-md shadow-xl"
            />
            <div className="absolute top-2 right-2 flex gap-2">
                {selectedBoxIndex !== null && (
                    <button
                        onClick={() => removeBox(selectedBoxIndex)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                        Remove Box
                    </button>
                )}
                <button
                    onClick={clearBoxes}
                    className="bg-white/80 hover:bg-white px-3 py-1 rounded text-sm"
                >
                    Clear All
                </button>
            </div>
            <div className="absolute bottom-2 left-2 text-sm text-white bg-black/50 px-2 py-1 rounded">
                Highlight areas to edit.
            </div>
        </div>
    );
}