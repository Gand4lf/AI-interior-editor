import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    // Extract the base64 data
    const base64Data = image.split(',')[1];

    // Upload to ImgBB
    const formData = new FormData();
    formData.append('image', base64Data);
    formData.append('key', process.env.IMGBB_API_KEY || '');

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image to ImgBB');
    }

    const data = await response.json();
    console.log('ImgBB upload response:', data);

    // Ensure we're using HTTPS URL
    let imageUrl = data.data.url;
    if (imageUrl.startsWith('http://')) {
      imageUrl = imageUrl.replace('http://', 'https://');
    }

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}