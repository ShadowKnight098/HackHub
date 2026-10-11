import { z } from 'zod';

const envSchema = z.object({
  VITE_DATABASE_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  VITE_IMAGEKIT_URL_ENDPOINT: z.string().optional(),
  VITE_IMAGEKIT_PUBLIC_KEY: z.string().optional(),
  VITE_MAP_STYLE_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse({
  VITE_DATABASE_URL: import.meta.env.VITE_DATABASE_URL || import.meta.env.DATABASE_URL,
  DATABASE_URL: import.meta.env.DATABASE_URL,
  VITE_IMAGEKIT_URL_ENDPOINT: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
  VITE_IMAGEKIT_PUBLIC_KEY: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
  VITE_MAP_STYLE_URL: import.meta.env.VITE_MAP_STYLE_URL,
});

if (!parsed.success) {
  console.warn(
    'Environment variable validation warning:\n',
    parsed.error.format()
  );
}

const dbUrl =
  import.meta.env.VITE_DATABASE_URL ||
  import.meta.env.DATABASE_URL ||
  '';

const imagekitUrl = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/yhi7cragd/something';
const imagekitPublicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || 'public_JghfxXwOa5llJM5EH+HhNJzXqyk=';
const imagekitPrivateKey = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY || 'private_IhEzuY0pIMwTcU5BHezMgih+yjA=';

export const env = {
  databaseUrl: dbUrl,
  imagekitUrlEndpoint: imagekitUrl,
  imagekitPublicKey: imagekitPublicKey,
  imagekitPrivateKey: imagekitPrivateKey,
  mapStyleUrl: import.meta.env.VITE_MAP_STYLE_URL || 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  isNeonConfigured: Boolean(dbUrl && dbUrl.startsWith('postgres')),
  isImageKitConfigured: Boolean(imagekitUrl && imagekitPublicKey && imagekitPrivateKey),
  isConfigured: Boolean(dbUrl && dbUrl.startsWith('postgres')),
};
