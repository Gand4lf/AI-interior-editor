import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Create form data
    const formData = new FormData();
    formData.append('key', process.env.IMGBB_API_KEY || '');
    formData.append('image', base64Data);

    // Upload to ImgBB
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('ImgBB API error:', errorData);
      throw new Error(`ImgBB API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('ImgBB response:', data);

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to upload image');
    }

    return NextResponse.json({ url: data.data.url });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ 
      error: (error as Error).message,
      details: error 
    }, { status: 500 });
  }
}