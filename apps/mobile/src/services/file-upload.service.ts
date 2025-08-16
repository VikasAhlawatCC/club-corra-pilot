import { environment } from '../config/environment';
import { apiService } from './api.service';

interface UploadUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface UploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  expiresAt: Date;
}

interface ConfirmUploadRequest {
  fileKey: string;
  fileUrl: string;
}

class FileUploadService {
  async getUploadUrl(request: UploadUrlRequest): Promise<UploadUrlResponse> {
    const response = await apiService.post<Partial<UploadUrlResponse>>('/files/upload-url', request);
    
    if (!response.expiresAt || !response.uploadUrl || !response.fileKey) {
      throw new Error('Invalid response: missing required fields');
    }
    
    return {
      uploadUrl: response.uploadUrl,
      fileKey: response.fileKey,
      expiresAt: new Date(response.expiresAt),
    };
  }

  async confirmUpload(request: ConfirmUploadRequest): Promise<any> {
    const response = await apiService.post('/files/confirm-upload', request);
    return response;
  }

  async uploadFileToS3(uploadUrl: string, file: File | Blob): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file to S3: ${response.status}`);
    }
  }
}

export const fileUploadService = new FileUploadService();
