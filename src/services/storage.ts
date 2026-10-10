import { supabase } from '@/lib/supabase';

export const storageService = {
  /**
   * Upload an image (dataURL or File/Blob) to Supabase Storage Bucket.
   * If the bucket doesn't exist yet or is forbidden, falls back to the dataUrl.
   */
  async uploadImage(
    imageData: string | Blob | File,
    bucket: string = 'gallery',
    folder: string = 'uploads'
  ): Promise<string> {
    try {
      let fileBody: Blob | File;
      let fileExt = 'jpg';

      if (typeof imageData === 'string') {
        if (!imageData.startsWith('data:')) {
          // Already a direct URL
          return imageData;
        }

        // Convert base64 dataUrl to Blob
        const match = imageData.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (match && match[1] && match[2]) {
          fileExt = match[1] === 'jpeg' ? 'jpg' : match[1];
          const byteCharacters = atob(match[2]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          fileBody = new Blob([byteArray], { type: `image/${match[1]}` });
        } else {
          return imageData;
        }
      } else {
        fileBody = imageData;
        if (imageData instanceof File && imageData.name.includes('.')) {
          fileExt = imageData.name.split('.').pop() || 'jpg';
        }
      }

      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      // Upload to Supabase bucket
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, fileBody, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn(`Supabase storage bucket upload error (${bucket}):`, error.message);
        // If upload fails (e.g. bucket not created in Supabase dashboard), return original image
        return typeof imageData === 'string' ? imageData : URL.createObjectURL(fileBody);
      }

      if (data) {
        // Retrieve public URL
        const { data: publicData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Storage service exception:', err);
    }

    return typeof imageData === 'string' ? imageData : '';
  },
};
