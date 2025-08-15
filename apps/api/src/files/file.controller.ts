import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
  Get,
  Param,
  Res,
  HttpException,
  HttpStatus,
  Options,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileService } from './file.service';
import { Response } from 'express';
import axios from 'axios';

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

  @Get('receipt-image/:fileKey')
  async getReceiptImage(@Param('fileKey') fileKey: string, @Res() res: Response) {
    try {
      const file = await this.fileService.getReceiptImage(fileKey);

      if (!file) {
        throw new HttpException('Receipt image not found', HttpStatus.NOT_FOUND);
      }

      res.setHeader('Content-Type', file.fileType);
      res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
      res.send(file.fileContent);
    } catch (error) {
      this.logger.error(`Failed to serve receipt image for fileKey ${fileKey}: ${error.message}`);
      throw error;
    }
  }

  @Get('public/receipt-image/:fileKey')
  async getPublicReceiptImage(@Param('fileKey') fileKey: string, @Res() res: Response) {
    try {
      const file = await this.fileService.getReceiptImage(fileKey);

      if (!file) {
        throw new HttpException('Receipt image not found', HttpStatus.NOT_FOUND);
      }

      // Set CORS headers for public access
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', file.fileType);
      res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(file.fileContent);
    } catch (error) {
      this.logger.error(`Failed to serve public receipt image for fileKey ${fileKey}: ${error.message}`);
      throw error;
    }
  }

  @Options('public/receipt-image/:fileKey')
  async optionsPublicReceiptImage(@Param('fileKey') fileKey: string, @Res() res: Response) {
    // Handle preflight CORS request
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
    res.status(200).send();
  }
}
