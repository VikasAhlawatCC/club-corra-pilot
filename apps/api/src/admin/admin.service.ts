import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin, AdminRole, AdminStatus } from './admin.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  async createAdmin(adminData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: AdminRole;
    phoneNumber?: string;
    department?: string;
    permissions?: string;
  }): Promise<Admin> {
    // Check if admin with email already exists
    const existingAdmin = await this.adminRepository.findOne({
      where: { email: adminData.email },
    });

    if (existingAdmin) {
      throw new BadRequestException('Admin with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Create admin
    const admin = this.adminRepository.create({
      ...adminData,
      passwordHash: hashedPassword,
      role: adminData.role || AdminRole.ADMIN,
      status: AdminStatus.ACTIVE,
    });

    return await this.adminRepository.save(admin);
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return await this.adminRepository.findOne({
      where: { email },
    });
  }

  async findById(id: string): Promise<Admin | null> {
    return await this.adminRepository.findOne({
      where: { id },
    });
  }

  async findAll(): Promise<Admin[]> {
    return await this.adminRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async updateAdmin(id: string, updateData: Partial<Admin>): Promise<Admin> {
    const admin = await this.findById(id);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // If password is being updated, hash it
    if (updateData.passwordHash) {
      updateData.passwordHash = await bcrypt.hash(updateData.passwordHash, 10);
    }

    Object.assign(admin, updateData);
    return await this.adminRepository.save(admin);
  }

  async deleteAdmin(id: string): Promise<void> {
    const admin = await this.findById(id);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    await this.adminRepository.remove(admin);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.adminRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async updateRefreshToken(id: string, refreshTokenHash: string): Promise<void> {
    await this.adminRepository.update(id, {
      refreshTokenHash,
    });
  }

  async verifyPassword(id: string, password: string): Promise<boolean> {
    const admin = await this.findById(id);
    if (!admin) {
      return false;
    }

    return await bcrypt.compare(password, admin.passwordHash);
  }

  async getAdminStats(): Promise<{
    totalAdmins: number;
    activeAdmins: number;
    superAdmins: number;
  }> {
    const [totalAdmins, activeAdmins, superAdmins] = await Promise.all([
      this.adminRepository.count(),
      this.adminRepository.count({ where: { status: AdminStatus.ACTIVE } }),
      this.adminRepository.count({ where: { role: AdminRole.SUPER_ADMIN } }),
    ]);

    return {
      totalAdmins,
      activeAdmins,
      superAdmins,
    };
  }
}
