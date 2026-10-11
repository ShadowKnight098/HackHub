import { env } from '@/lib/env';

/**
 * Generates official ImageKit client-side authentication parameters
 * via Web Crypto HMAC-SHA1.
 */
async function generateImageKitAuth(privateKey: string): Promise<{ token: string; expire: string; signature: string }> {
  const token =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const expire = (Math.floor(Date.now() / 1000) + 1800).toString(); // 30 minutes in future

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(privateKey),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(token + expire));
  const signature = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { token, expire, signature };
}

export const storageService = {
  /**
   * Upload image directly to ImageKit Media Library using authenticated client upload
   */
  async uploadImage(
    imageData: string | Blob | File,
    folder: string = '/hackhub-photos'
  ): Promise<string> {
    try {
      // If already a hosted URL, return as is
      if (typeof imageData === 'string' && imageData.startsWith('http')) {
        return imageData;
      }

      const privKey = env.imagekitPrivateKey;
      const pubKey = env.imagekitPublicKey;

      if (!privKey || !pubKey) {
        console.warn('ImageKit credentials missing in environment');
        return typeof imageData === 'string' ? imageData : URL.createObjectURL(imageData as Blob);
      }

      // Generate HMAC-SHA1 authentication parameters
      const { token, expire, signature } = await generateImageKitAuth(privKey);

      const formData = new FormData();
      if (typeof imageData === 'string') {
        formData.append('file', imageData);
      } else {
        formData.append('file', imageData, `photo_${Date.now()}.jpg`);
      }

      const cleanFolder = folder.startsWith('/') ? folder : `/${folder}`;
      formData.append('fileName', `photo_${Date.now()}.jpg`);
      formData.append('publicKey', pubKey);
      formData.append('signature', signature);
      formData.append('expire', expire);
      formData.append('token', token);
      formData.append('folder', cleanFolder);
      formData.append('useUniqueFileName', 'true');

      const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('ImageKit upload error:', response.status, errorText);
        return typeof imageData === 'string' ? imageData : URL.createObjectURL(imageData as Blob);
      }

      const data = await response.json();
      if (data && data.url) {
        return data.url;
      }

      return typeof imageData === 'string' ? imageData : '';
    } catch (err) {
      console.warn('ImageKit storage upload failed:', err);
      return typeof imageData === 'string' ? imageData : '';
    }
  },

  /**
   * Fetch uploaded images directly from ImageKit Media Library
   */
  async listFiles(path: string = '/hackhub-photos', limit: number = 30): Promise<Array<{ fileId: string; name: string; url: string; createdAt: string; filePath: string }>> {
    try {
      const privKey = env.imagekitPrivateKey;
      if (!privKey) return [];

      const authHeader = 'Basic ' + btoa(`${privKey}:`);
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      const res = await fetch(`https://api.imagekit.io/v1/files?path=${encodeURIComponent(cleanPath)}&limit=${limit}&sort=DESC_CREATED`, {
        headers: {
          Authorization: authHeader,
        },
      });

      if (!res.ok) {
        // Fallback without path filter if specific path query fails
        const fallbackRes = await fetch(`https://api.imagekit.io/v1/files?limit=${limit}&sort=DESC_CREATED`, {
          headers: {
            Authorization: authHeader,
          },
        });
        if (!fallbackRes.ok) return [];
        const files = await fallbackRes.json();
        return Array.isArray(files) ? files.filter((f: any) => f.fileType === 'image') : [];
      }

      const files = await res.json();
      return Array.isArray(files) ? files.filter((f: any) => f.fileType === 'image') : [];
    } catch (err) {
      console.warn('ImageKit listFiles failed:', err);
      return [];
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
