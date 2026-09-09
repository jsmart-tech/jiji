export interface PresignedUploadUrl {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
  expiresIn: number;
}
