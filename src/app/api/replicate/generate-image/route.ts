import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Validate URL format
const isValidUrl = (url: string) => {
    try {
        new URL(url);
        return url.startsWith('http://') || url.startsWith('https://');
    } catch {
        return false;
    }
};

export async function POST(req: Request) {
    try {
        const { prompt, image, mask, controlnet, inpaint } = await req.json();

        // Validate URLs if provided
        if (image && !isValidUrl(image)) {
            return NextResponse.json(
                { error: 'Invalid image URL format' },
                { status: 400 }
            );
        }

        if (mask && !isValidUrl(mask)) {
            return NextResponse.json(
                { error: 'Invalid mask URL format' },
                { status: 400 }
            );
        }

        let prediction;
        
        // Initial generation (no image provided)
        if (!image) {
            prediction = await replicate.run(
                "black-forest-labs/flux-1.1-pro",
                {
                    input: {
                        prompt: `${prompt}, super detailed, realistic, 8k`,
                        num_inference_steps: 30,
                        guidance_scale: 7.5,
                        num_samples: 1,
                        scheduler: "DPM++ 2M Karras"
                    }
                }
            );
        }
        // Inpainting with layer masks
        else if (inpaint && mask) {
            prediction = await replicate.run(
                "black-forest-labs/flux-fill-pro",
                {
                    input: {
                        prompt: `${prompt}, super detailed, realistic, 8k`,
                        image: image.trim(),
                        mask: mask.trim(),
                        num_inference_steps: 30,
                        scheduler: "DPM++ 2M Karras",
                        strength: 0.99,
                        num_samples: 1
                    }
                }
            );
        } 
        // General edits (no masks)
        else if (controlnet) {
            prediction = await replicate.run(
                "black-forest-labs/flux-depth-pro",
                {
                    input: {
                        prompt: `${prompt}, super detailed, realistic, 8k`,
                        control_image: image.trim(),
                        num_inference_steps: 30,
                        guidance_scale: 7.5,
                        num_samples: 1,
                        scheduler: "DPM++ 2M Karras"
                    }
                }
            );
        } else {
            return NextResponse.json(
                { error: 'Invalid request - must provide either a prompt for initial generation, inpaint with mask, or controlnet edit' },
                { status: 400 }
            );
        }

        console.log('Prediction:', prediction);

        if (!prediction) {
            return NextResponse.json(
                { error: 'Failed to generate image' },
                { status: 500 }
            );
        }

        // Handle different response formats
        const imageUrl = Array.isArray(prediction) ? prediction[0] : prediction;

        return NextResponse.json({ imageUrl });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
}
