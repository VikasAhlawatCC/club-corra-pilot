import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminsTable1700000000011 implements MigrationInterface {
  name = 'CreateAdminsTable1700000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if enum types already exist by trying to query them
    let adminRoleEnumExists = false;
    let adminStatusEnumExists = false;
    
    try {
      await queryRunner.query(`SELECT 'ADMIN'::admin_role_enum`);
      adminRoleEnumExists = true;
    } catch (error) {
      adminRoleEnumExists = false;
    }
    
    try {
      await queryRunner.query(`SELECT 'ACTIVE'::admin_status_enum`);
      adminStatusEnumExists = true;
    } catch (error) {
      adminStatusEnumExists = false;
    }
    
    // Create enum types for admin roles and status if they don't exist
    if (!adminRoleEnumExists) {
      await queryRunner.query(`
        CREATE TYPE "public"."admin_role_enum" AS ENUM('ADMIN', 'SUPER_ADMIN')
      `);
    }

    if (!adminStatusEnumExists) {
      await queryRunner.query(`
        CREATE TYPE "public"."admin_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED')
      `);
    }

    // Check if admins table already exists
    const adminsTableExists = await queryRunner.hasTable('admins');
    
    if (!adminsTableExists) {
      // Create admins table
      await queryRunner.query(`
        CREATE TABLE "admins" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "email" character varying NOT NULL,
          "passwordHash" character varying NOT NULL,
          "firstName" character varying NOT NULL,
          "lastName" character varying NOT NULL,
          "role" "public"."admin_role_enum" NOT NULL DEFAULT 'ADMIN',
          "status" "public"."admin_status_enum" NOT NULL DEFAULT 'ACTIVE',
          "profilePicture" character varying,
          "phoneNumber" character varying,
          "department" character varying,
          "permissions" character varying,
          "lastLoginAt" TIMESTAMP,
          "refreshTokenHash" character varying,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "UQ_admins_email" UNIQUE ("email"),
          CONSTRAINT "PK_admins" PRIMARY KEY ("id")
        )
      `);

      // Create indexes
      await queryRunner.query(`
        CREATE INDEX "IDX_admins_email" ON "admins" ("email")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_admins_role" ON "admins" ("role")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_admins_status" ON "admins" ("status")
      `);

      // Add comment
      await queryRunner.query(`
        COMMENT ON TABLE "admins" IS 'Admin users with system management privileges'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if admins table exists before dropping
    const adminsTableExists = await queryRunner.hasTable('admins');
    
    if (adminsTableExists) {
      // Drop indexes
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admins_status"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admins_role"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admins_email"`);

      // Drop table
      await queryRunner.query(`DROP TABLE IF EXISTS "admins"`);
    }

    // Drop enum types if they exist
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."admin_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."admin_role_enum"`);
  }
}
