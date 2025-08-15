import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Admin, AdminRole, AdminStatus } from './admin.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async createAdmin(@Body() adminData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: AdminRole;
    phoneNumber?: string;
    department?: string;
    permissions?: string;
  }) {
    const admin = await this.adminService.createAdmin(adminData);
    return {
      success: true,
      message: 'Admin created successfully',
      data: admin,
    };
  }

  @Get()
  async getAllAdmins() {
    const admins = await this.adminService.findAll();
    return {
      success: true,
      message: 'Admins retrieved successfully',
      data: admins,
    };
  }

  @Get('stats')
  async getAdminStats() {
    const stats = await this.adminService.getAdminStats();
    return {
      success: true,
      message: 'Admin statistics retrieved successfully',
      data: stats,
    };
  }

  @Get(':id')
  async getAdminById(@Param('id') id: string) {
    const admin = await this.adminService.findById(id);
    if (!admin) {
      return {
        success: false,
        message: 'Admin not found',
        data: null,
      };
    }
    return {
      success: true,
      message: 'Admin retrieved successfully',
      data: admin,
    };
  }

  @Put(':id')
  async updateAdmin(
    @Param('id') id: string,
    @Body() updateData: Partial<Admin>,
  ) {
    const admin = await this.adminService.updateAdmin(id, updateData);
    return {
      success: true,
      message: 'Admin updated successfully',
      data: admin,
    };
  }

  @Delete(':id')
  async deleteAdmin(@Param('id') id: string) {
    await this.adminService.deleteAdmin(id);
    return {
      success: true,
      message: 'Admin deleted successfully',
      data: null,
    };
  }

  @Get('profile/me')
  async getMyProfile(@Request() req) {
    const admin = await this.adminService.findById(req.user.id);
    if (!admin) {
      return {
        success: false,
        message: 'Admin not found',
        data: null,
      };
    }
    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: admin,
    };
  }

  @Put('profile/me')
  async updateMyProfile(
    @Request() req,
    @Body() updateData: Partial<Admin>,
  ) {
    // Remove sensitive fields that shouldn't be updated via profile update
    const { role, status, ...safeUpdateData } = updateData;
    
    const admin = await this.adminService.updateAdmin(req.user.id, safeUpdateData);
    return {
      success: true,
      message: 'Profile updated successfully',
      data: admin,
    };
  }
}
