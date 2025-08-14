import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileService } from './file.service';

export interface GetUploadUrlDto {
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface ConfirmUploadDto {
  fileKey: string;
  fileUrl: string;
}

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(private readonly fileService: FileService) {}

  @Post('upload-url')
  async getUploadUrl(@Body() getUploadUrlDto: GetUploadUrlDto, @Request() req) {
    const userId = req.user.sub;
    const { fileName, fileType, fileSize } = getUploadUrlDto;

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedTypes.includes(fileType)) {
        throw new BadRequestException(`File type ${fileType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (fileSize > maxSize) {
        throw new BadRequestException(`File size ${fileSize} bytes exceeds maximum allowed size of ${maxSize} bytes`);
      }

      const uploadData = await this.fileService.getUploadUrl(userId, fileName, fileType, fileSize);

      return {
        success: true,
        message: 'Upload URL generated successfully',
        data: uploadData,
      };
    } catch (error) {
      this.logger.error(`Failed to generate upload URL for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Post('confirm-upload')
  async confirmUpload(@Body() confirmUploadDto: ConfirmUploadDto, @Request() req) {
    const userId = req.user.sub;
    const { fileKey, fileUrl } = confirmUploadDto;

    try {
      const fileRecord = await this.fileService.confirmUpload(userId, fileKey, fileUrl);

      return {
        success: true,
        message: 'File upload confirmed successfully',
        data: { file: fileRecord },
      };
    } catch (error) {
      this.logger.error(`Failed to confirm upload for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Post('validate-receipt')
  async validateReceipt(@Body() body: { fileKey: string }, @Request() req) {
    const userId = req.user.sub;
    const { fileKey } = body;

    try {
      const validationResult = await this.fileService.validateReceipt(userId, fileKey);

      return {
        success: true,
        message: 'Receipt validation completed',
        data: validationResult,
      };
    } catch (error) {
      this.logger.error(`Failed to validate receipt for user ${userId}: ${error.message}`);
      throw error;
    }
  }
}
