const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.5:3001';

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
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/files/${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        'X-Client-Type': 'mobile',
        'User-Agent': 'ClubCorra-Mobile/1.0.0',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getUploadUrl(request: UploadUrlRequest): Promise<UploadUrlResponse> {
    const response = await this.makeRequest<Partial<UploadUrlResponse>>('upload-url', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
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
    const response = await this.makeRequest('confirm-upload', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
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
