import { cloudinaryConfig } from '../config';

// Configuration is now sourced from config.ts
const CLOUDINARY_CLOUD_NAME = cloudinaryConfig.cloudName;
const CLOUDINARY_UPLOAD_PRESET = cloudinaryConfig.uploadPreset;

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Uploads a file to Cloudinary using an unsigned preset.
 * @param file The image file to upload.
 * @returns The secure URL of the uploaded image.
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Cloudinary API Error:', errorBody);
      throw new Error('فشل رفع الصورة. تأكد من إعدادات Cloudinary.');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Re-throw the error so it can be caught and handled by the calling component.
    throw error;
  }
}
