import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1700000000000 implements MigrationInterface {
  name = 'CreateInitialTables1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "public"."user_status_enum" AS ENUM('pending', 'active', 'suspended', 'deleted')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."otp_type_enum" AS ENUM('sms', 'email')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."otp_status_enum" AS ENUM('pending', 'verified', 'expired')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."payment_method_enum" AS ENUM('upi', 'card', 'net_banking', 'wallet')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."provider_type_enum" AS ENUM('google', 'facebook', 'apple')
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mobileNumber" character varying NOT NULL,
        "email" character varying,
        "status" "public"."user_status_enum" NOT NULL DEFAULT 'pending',
        "isMobileVerified" boolean NOT NULL DEFAULT false,
        "isEmailVerified" boolean NOT NULL DEFAULT false,
        "passwordHash" character varying,
        "refreshTokenHash" character varying,
        "lastLoginAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_mobileNumber" UNIQUE ("mobileNumber"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create user_profiles table
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "dateOfBirth" date,
        "gender" character varying,
        "profilePicture" character varying,
        "address" character varying,
        "city" character varying,
        "state" character varying,
        "country" character varying,
        "postalCode" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        CONSTRAINT "PK_user_profiles" PRIMARY KEY ("id")
      )
    `);

    // Create payment_details table
    await queryRunner.query(`
      CREATE TABLE "payment_details" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "upiId" character varying,
        "preferredMethod" "public"."payment_method_enum",
        "cardLastFour" character varying,
        "cardBrand" character varying,
        "walletType" character varying,
        "isDefault" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        CONSTRAINT "PK_payment_details" PRIMARY KEY ("id")
      )
    `);

    // Create auth_providers table
    await queryRunner.query(`
      CREATE TABLE "auth_providers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "provider" "public"."provider_type_enum" NOT NULL,
        "providerUserId" character varying NOT NULL,
        "accessToken" character varying,
        "refreshToken" character varying,
        "tokenExpiresAt" TIMESTAMP,
        "providerData" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        CONSTRAINT "UQ_auth_providers_providerUserId" UNIQUE ("providerUserId"),
        CONSTRAINT "PK_auth_providers" PRIMARY KEY ("id")
      )
    `);

    // Create otps table
    await queryRunner.query(`
      CREATE TABLE "otps" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "identifier" character varying NOT NULL,
        "type" "public"."otp_type_enum" NOT NULL,
        "code" character varying NOT NULL,
        "status" "public"."otp_status_enum" NOT NULL DEFAULT 'pending',
        "expiresAt" TIMESTAMP NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "verifiedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_otps" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_otps_identifier_type_status" ON "otps" ("identifier", "type", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_mobileNumber" ON "users" ("mobileNumber")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_email" ON "users" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_auth_providers_provider" ON "auth_providers" ("provider")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_user_profiles_userId" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "payment_details" ADD CONSTRAINT "FK_payment_details_userId" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "auth_providers" ADD CONSTRAINT "FK_auth_providers_userId" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "auth_providers" DROP CONSTRAINT "FK_auth_providers_userId"
    `);

    await queryRunner.query(`
      ALTER TABLE "payment_details" DROP CONSTRAINT "FK_payment_details_userId"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_user_profiles_userId"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "IDX_auth_providers_provider"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_users_email"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_users_mobileNumber"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_otps_identifier_type_status"
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE "otps"`);
    await queryRunner.query(`DROP TABLE "auth_providers"`);
    await queryRunner.query(`DROP TABLE "payment_details"`);
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."provider_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payment_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."otp_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."otp_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);
  }
}
