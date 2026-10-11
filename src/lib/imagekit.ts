import ImageKit from 'imagekit-javascript';
import { env } from './env';

export const imagekit = new ImageKit({
  publicKey: env.imagekitPublicKey,
  urlEndpoint: env.imagekitUrlEndpoint,
});

export const isImageKitConfigured = Boolean(
  env.imagekitPublicKey && env.imagekitUrlEndpoint
);
