import api from './client';
import type { PresignedUploadUrl } from './types';

// ─── Media API ────────────────────────────────────────────

export const mediaApi = {
  getPresignedUrl: async (
    contentType: string,
    folder: 'listings' | 'avatars' | 'kyc' = 'listings',
  ): Promise<PresignedUploadUrl> => {
    const res = await api.post<PresignedUploadUrl>('/media/presigned-url', { contentType, folder });
    return res.data;
  },

  getBatchPresignedUrls: async (
    files: Array<{ contentType: string; folder?: 'listings' | 'avatars' | 'kyc' }>,
  ): Promise<PresignedUploadUrl[]> => {
    const res = await api.post<PresignedUploadUrl[]>('/media/presigned-urls/batch', { files });
    return res.data;
  },

  /**
   * Upload a file directly to S3 using a pre-signed URL.
   * This happens on the client — no server-side upload proxy needed.
   */
  uploadToS3: async (
    presignedUrl: string,
    uri: string,
    contentType: string,
    onProgress?: (progress: number) => void,
  ): Promise<void> => {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignedUrl, true);
      xhr.setRequestHeader('Content-Type', contentType);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Upload network error'));
      xhr.send(blob);
    });
  },

  deleteMedia: async (listingId: string, mediaId: string): Promise<void> => {
    await api.delete(`/media/listing/${listingId}/${mediaId}`);
  },
};
