import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './file.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly configService: ConfigService,
  ) {}

  async getUploadUrl(
    userId: string,
    fileName: string,
    fileType: string,
    fileSize: number,
  ): Promise<{
    uploadUrl: string;
    fileKey: string;
    expiresAt: Date;
  }> {
    try {
      // Generate unique file key
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileKey = `uploads/${userId}/${timestamp}-${randomString}-${fileName}`;

      // Set expiration time (1 hour from now)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // For now, we'll return a mock upload URL since S3 is not configured
      // In production, this would generate a signed S3 URL
      const uploadUrl = `https://mock-s3-url.com/${fileKey}`;

      // Create file record (status: UPLOADING)
      const fileRecord = this.fileRepository.create({
        userId,
        fileName,
        fileKey,
        fileType,
        fileSize,
        status: 'UPLOADING',
        fileUrl: uploadUrl, // placeholder/public URL
      } as Partial<File>);

      await this.fileRepository.save(fileRecord);

      this.logger.log(`Upload URL generated for user ${userId}: ${fileKey}`);

      return {
        uploadUrl,
        fileKey,
        expiresAt,
      };
    } catch (error) {
      this.logger.error(`Failed to generate upload URL: ${error.message}`);
      throw error;
    }
  }

  async confirmUpload(
    userId: string,
    fileKey: string,
    fileUrl: string,
  ): Promise<File> {
    try {
      const fileRecord = await this.fileRepository.findOne({
        where: { fileKey, userId },
      });

      if (!fileRecord) {
        throw new NotFoundException('File record not found');
      }

      if (fileRecord.status !== 'UPLOADING') {
        throw new BadRequestException('File is not in uploading status');
      }

      // Update file record
      fileRecord.status = 'UPLOADED';
      fileRecord.fileUrl = fileUrl;

      const updatedFile = await this.fileRepository.save(fileRecord);

      this.logger.log(`File upload confirmed: ${fileKey}`);

      return updatedFile;
    } catch (error) {
      this.logger.error(`Failed to confirm upload: ${error.message}`);
      throw error;
    }
  }

  async validateReceipt(userId: string, fileKey: string): Promise<{
    isValid: boolean;
    validationDetails: any;
    recommendations: string[];
  }> {
    try {
      const fileRecord = await this.fileRepository.findOne({
        where: { fileKey, userId },
      });

      if (!fileRecord) {
        throw new NotFoundException('File record not found');
      }

      if (fileRecord.status !== 'UPLOADED') {
        throw new BadRequestException('File is not uploaded yet');
      }

      // Basic validation logic (in production, this would use OCR or AI)
      const validationDetails = {
        fileType: fileRecord.fileType,
        fileSize: fileRecord.fileSize,
        uploadDate: fileRecord.updatedAt,
        // Mock validation results
        hasReceiptElements: true,
        isReadable: true,
        containsAmount: true,
        containsDate: true,
        containsBrandInfo: true,
      };

      const recommendations: string[] = [];

      // Check file size
      if (fileRecord.fileSize > 5 * 1024 * 1024) { // 5MB
        recommendations.push('File size is large. Consider compressing the image for better processing.');
      }

      // Check file type
      if (!['image/jpeg', 'image/png'].includes(fileRecord.fileType)) {
        recommendations.push('JPEG or PNG format is recommended for better OCR accuracy.');
      }

      // Mock validation result
      const isValid = validationDetails.hasReceiptElements && 
                     validationDetails.isReadable && 
                     validationDetails.containsAmount;

      this.logger.log(`Receipt validation completed for ${fileKey}: ${isValid ? 'VALID' : 'INVALID'}`);

      return {
        isValid,
        validationDetails,
        recommendations,
      };
    } catch (error) {
      this.logger.error(`Failed to validate receipt: ${error.message}`);
      throw error;
    }
  }

  async getFileById(fileId: string): Promise<File> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('File not found');
      }

      return file;
    } catch (error) {
      this.logger.error(`Failed to get file by ID: ${error.message}`);
      throw error;
    }
  }

  async getUserFiles(
    userId: string,
    options: {
      status?: 'UPLOADING' | 'UPLOADED' | 'FAILED';
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ files: File[]; total: number; page: number; limit: number }> {
    try {
      const { status, page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const queryBuilder = this.fileRepository
        .createQueryBuilder('file')
        .where('file.userId = :userId', { userId });

      if (status) {
        queryBuilder.andWhere('file.status = :status', { status });
      }

      const [files, total] = await queryBuilder
        .orderBy('file.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        files,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Failed to get user files: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id: fileId, userId },
      });

      if (!file) {
        throw new NotFoundException('File not found or access denied');
      }

      // In production, this would also delete the file from S3
      await this.fileRepository.remove(file);

      this.logger.log(`File deleted: ${fileId}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }
  }

  async updateFileStatus(
    fileId: string,
    status: 'UPLOADING' | 'UPLOADED' | 'FAILED',
  ): Promise<File> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id: fileId },
      });

      if (!file) {
        throw new NotFoundException('File not found');
      }

      file.status = status;

      const updatedFile = await this.fileRepository.save(file);

      this.logger.log(`File status updated: ${fileId} -> ${status}`);

      return updatedFile;
    } catch (error) {
      this.logger.error(`Failed to update file status: ${error.message}`);
      throw error;
    }
  }

  async getFileStats(userId: string): Promise<{
    totalFiles: number;
    uploadedFiles: number;
    pendingFiles: number;
    totalSize: number;
  }> {
    try {
      const [totalFiles, uploadedFiles, pendingFiles, totalSizeResult] = await Promise.all([
        this.fileRepository.count({ where: { userId } }),
        this.fileRepository.count({ where: { userId, status: 'UPLOADED' } }),
        this.fileRepository.count({ where: { userId, status: 'UPLOADING' } }),
        this.fileRepository
          .createQueryBuilder('file')
          .select('SUM(file.fileSize)', 'totalSize')
          .where('file.userId = :userId', { userId })
          .getRawOne(),
      ]);

      const totalSize = parseInt(totalSizeResult?.totalSize || '0');

      return {
        totalFiles,
        uploadedFiles,
        pendingFiles,
        totalSize,
      };
    } catch (error) {
      this.logger.error(`Failed to get file stats: ${error.message}`);
      throw error;
    }
  }
}
