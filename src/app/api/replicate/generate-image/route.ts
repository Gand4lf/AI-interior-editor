import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Convert ImgBB URL to direct image URL
const getDirectImageUrl = (url: string) => {
    try {
        // ImgBB URLs are like https://i.ibb.co/{hash}/{filename}
        // We need to ensure it points directly to the image
        if (url.includes('i.ibb.co') && !url.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return `${url}.jpg`; // Force .jpg extension for images
        }
        return url;
    } catch (error) {
        console.error('URL conversion error:', error);
        return url;
    }
};

export async function POST(req: Request) {
    try {
        const { prompt, image, mask, controlnet, inpaint } = await req.json();
        console.log('Raw request:', { prompt, image, mask, controlnet, inpaint });

        // Convert URLs to direct image URLs
        const processedImage = image ? getDirectImageUrl(image) : null;
        const processedMask = mask ? getDirectImageUrl(mask) : null;

        console.log('Processed URLs:', { 
            image: processedImage, 
            mask: processedMask 
        });

        let prediction;
        let modelInputs;
        
        // Initial generation (no image provided)
        if (!processedImage) {
            modelInputs = {
                prompt: `${prompt}, super detailed, realistic, 8k`,
                num_inference_steps: 30,
                guidance_scale: 7.5,
                num_samples: 1,
                scheduler: "DPM++ 2M Karras"
            };
            console.log('Running initial generation with:', modelInputs);
            prediction = await replicate.run(
                "black-forest-labs/flux-1.1-pro",
                { input: modelInputs }
            );
        }
        // Inpainting with layer masks
        else if (inpaint && processedMask) {
            modelInputs = {
                prompt: `${prompt}, super detailed, realistic, 8k`,
                image: processedImage,
                mask: processedMask,
                num_inference_steps: 30,
                scheduler: "DPM++ 2M Karras",
                strength: 0.99,
                num_samples: 1
            };
            console.log('Running inpainting with:', modelInputs);
            prediction = await replicate.run(
                "black-forest-labs/flux-fill-pro",
                { input: modelInputs }
            );
        } 
        // General edits (no masks)
        else if (controlnet) {
            modelInputs = {
                prompt: `${prompt}, super detailed, realistic, 8k`,
                control_image: processedImage,
                num_inference_steps: 30,
                guidance_scale: 7.5,
                num_samples: 1,
                scheduler: "DPM++ 2M Karras"
            };
            console.log('Running controlnet edit with:', modelInputs);
            prediction = await replicate.run(
                "black-forest-labs/flux-depth-pro",
                { input: modelInputs }
            );
        } else {
            return NextResponse.json(
                { error: 'Invalid request - must provide either a prompt for initial generation, inpaint with mask, or controlnet edit' },
                { status: 400 }
            );
        }

        console.log('Prediction result:', prediction);

        if (!prediction) {
            return NextResponse.json(
                { error: 'Failed to generate image' },
                { status: 500 }
            );
        }

        // Handle different response formats
        const imageUrl = Array.isArray(prediction) ? prediction[0] : prediction;
        console.log('Final image URL:', imageUrl);

        return NextResponse.json({ imageUrl });

    } catch (error) {
        console.error('Error details:', error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
}
