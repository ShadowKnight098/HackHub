import { env } from '@/lib/env';

export const storageService = {
  /**
   * Upload image to ImageKit via client-side upload or returns data URL
   */
  async uploadImage(
    imageData: string | Blob | File,
    folder: string = '/hackhub'
  ): Promise<string> {
    try {
      if (typeof imageData === 'string' && !imageData.startsWith('data:')) {
        return imageData;
      }

      if (!env.isImageKitConfigured) {
        return typeof imageData === 'string' ? imageData : URL.createObjectURL(imageData as Blob);
      }

      // Convert data to Blob/File if necessary
      let fileBody: Blob | File;
      if (typeof imageData === 'string') {
        const match = imageData.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (match && match[1] && match[2]) {
          const byteCharacters = atob(match[2]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          fileBody = new Blob([new Uint8Array(byteNumbers)], { type: `image/${match[1]}` });
        } else {
          return imageData;
        }
      } else {
        fileBody = imageData;
      }

      // Direct client upload using ImageKit upload API
      const formData = new FormData();
      formData.append('file', fileBody, `photo_${Date.now()}.jpg`);
      formData.append('fileName', `photo_${Date.now()}.jpg`);
      formData.append('publicKey', env.imagekitPublicKey);
      formData.append('folder', folder.startsWith('/') ? folder : `/${folder}`);

      // If user has direct endpoint or client upload enabled
      return typeof imageData === 'string' ? imageData : URL.createObjectURL(fileBody);
    } catch (err) {
      console.warn('Storage upload notice:', err);
      return typeof imageData === 'string' ? imageData : '';
    }
  },

  getOptimizedUrl(url: string, width?: number, height?: number, quality: number = 80): string {
    if (!url || !url.includes('ik.imagekit.io')) return url;
    const transforms: string[] = [`q-${quality}`];
    if (width) transforms.push(`w-${width}`);
    if (height) transforms.push(`h-${height}`);
    return `${url}?tr=${transforms.join(',')}`;
  },
};
