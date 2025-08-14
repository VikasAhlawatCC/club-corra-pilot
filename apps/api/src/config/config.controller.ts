import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GlobalConfigService } from './services/global-config.service';

export interface UpdateConfigDto {
  value: string | number | boolean | object;
}

@Controller('config')
@UseGuards(JwtAuthGuard)
export class ConfigController {
  private readonly logger = new Logger(ConfigController.name);

  constructor(private readonly globalConfigService: GlobalConfigService) {}

  @Get()
  async getAllConfigs() {
    try {
      const configs = await this.globalConfigService.getAllConfigs();

      return {
        success: true,
        message: 'All configurations retrieved successfully',
        data: { configs },
      };
    } catch (error) {
      this.logger.error(`Failed to get all configs: ${error.message}`);
      throw error;
    }
  }

  @Get('category/:category')
  async getConfigsByCategory(@Param('category') category: string) {
    try {
      const configs = await this.globalConfigService.getConfigsByCategory(category);

      return {
        success: true,
        message: `Configurations for category '${category}' retrieved successfully`,
        data: { configs },
      };
    } catch (error) {
      this.logger.error(`Failed to get configs by category ${category}: ${error.message}`);
      throw error;
    }
  }

  @Get('transaction')
  async getTransactionConfigs() {
    try {
      const configs = await this.globalConfigService.getTransactionConfigs();

      return {
        success: true,
        message: 'Transaction configurations retrieved successfully',
        data: { configs },
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction configs: ${error.message}`);
      throw error;
    }
  }

  @Get('brand')
  async getBrandConfigs() {
    try {
      const configs = await this.globalConfigService.getBrandConfigs();

      return {
        success: true,
        message: 'Brand configurations retrieved successfully',
        data: { configs },
      };
    } catch (error) {
      this.logger.error(`Failed to get brand configs: ${error.message}`);
      throw error;
    }
  }

  @Get('user')
  async getUserConfigs() {
    try {
      const configs = await this.globalConfigService.getUserConfigs();

      return {
        success: true,
        message: 'User configurations retrieved successfully',
        data: { configs },
      };
    } catch (error) {
      this.logger.error(`Failed to get user configs: ${error.message}`);
      throw error;
    }
  }

  @Get('security')
  async getSecurityConfigs() {
    try {
      const configs = await this.globalConfigService.getSecurityConfigs();

      return {
        success: true,
        message: 'Security configurations retrieved successfully',
        data: { configs },
      };
    } catch (error) {
      this.logger.error(`Failed to get security configs: ${error.message}`);
      throw error;
    }
  }

  @Put(':key')
  async updateConfig(
    @Param('key') key: string,
    @Body() updateConfigDto: UpdateConfigDto,
  ) {
    try {
      const { value } = updateConfigDto;

      if (value === undefined || value === null) {
        throw new BadRequestException('Value is required');
      }

      // Determine the type based on the value
      let type: 'string' | 'number' | 'boolean' | 'json' = 'string';
      if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (typeof value === 'object') {
        type = 'json';
      }

      await this.globalConfigService.setConfigValue(key, value, type);

      this.logger.log(`Configuration updated: ${key} = ${value}`);

      return {
        success: true,
        message: `Configuration '${key}' updated successfully`,
        data: { key, value, type },
      };
    } catch (error) {
      this.logger.error(`Failed to update config ${key}: ${error.message}`);
      throw error;
    }
  }

  @Get('initialize-defaults')
  async initializeDefaultConfigs() {
    try {
      await this.globalConfigService.initializeDefaultConfigs();

      return {
        success: true,
        message: 'Default configurations initialized successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to initialize default configs: ${error.message}`);
      throw error;
    }
  }

  @Get('cache/clear')
  async clearCache() {
    try {
      await this.globalConfigService.clearAllCache();

      return {
        success: true,
        message: 'Configuration cache cleared successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to clear config cache: ${error.message}`);
      throw error;
    }
  }
}
