import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPKAndFKTags1700000000006 implements MigrationInterface {
  name = 'AddPKAndFKTags1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add PK and FK tags to users table
    await queryRunner.query(`
      COMMENT ON COLUMN "users"."id" IS 'PK - Primary Key';
    `);

    // Add PK and FK tags to user_profiles table
    await queryRunner.query(`
      COMMENT ON COLUMN "user_profiles"."id" IS 'PK - Primary Key';
      COMMENT ON COLUMN "user_profiles"."userId" IS 'FK - References users(id)';
    `);

    // Add PK and FK tags to payment_details table
    await queryRunner.query(`
      COMMENT ON COLUMN "payment_details"."id" IS 'PK - Primary Key';
      COMMENT ON COLUMN "payment_details"."userId" IS 'FK - References users(id)';
    `);

    // Add PK and FK tags to auth_providers table
    await queryRunner.query(`
      COMMENT ON COLUMN "auth_providers"."id" IS 'PK - Primary Key';
      COMMENT ON COLUMN "auth_providers"."userId" IS 'FK - References users(id)';
    `);

    // Add PK tags to otps table
    await queryRunner.query(`
      COMMENT ON COLUMN "otps"."id" IS 'PK - Primary Key';
    `);

    // Add PK and FK tags to brand_categories table
    await queryRunner.query(`
      COMMENT ON COLUMN "brand_categories"."id" IS 'PK - Primary Key';
    `);

    // Add PK and FK tags to brands table
    await queryRunner.query(`
      COMMENT ON COLUMN "brands"."id" IS 'PK - Primary Key';
      COMMENT ON COLUMN "brands"."categoryId" IS 'FK - References brand_categories(id)';
      COMMENT ON COLUMN "brands"."minRedemptionAmount" IS 'Minimum amount required for redemption (default: 1)';
      COMMENT ON COLUMN "brands"."maxRedemptionAmount" IS 'Maximum amount that can be redeemed (default: 2000, same as brandwiseMaxCap)';
      COMMENT ON COLUMN "brands"."brandwiseMaxCap" IS 'Per-transaction maximum redemption limit (default: 2000, same as maxRedemptionAmount)';
    `);

    // Add PK and FK tags to coin_balances table
    await queryRunner.query(`
      COMMENT ON COLUMN "coin_balances"."id" IS 'PK - Primary Key';
      COMMENT ON COLUMN "coin_balances"."userId" IS 'FK - References users(id)';
    `);

    // Add PK and FK tags to coin_transactions table
    await queryRunner.query(`
      COMMENT ON COLUMN "coin_transactions"."id" IS 'PK - Primary Key';
      COMMENT ON COLUMN "coin_transactions"."userId" IS 'FK - References users(id)';
      COMMENT ON COLUMN "coin_transactions"."brandId" IS 'FK - References brands(id)';
    `);

    // Add PK tags to global_config table
    await queryRunner.query(`
      COMMENT ON COLUMN "global_config"."id" IS 'PK - Primary Key';
    `);

    // Add table-level comments for better documentation
    await queryRunner.query(`
      COMMENT ON TABLE "users" IS 'Core user accounts with authentication details';
      COMMENT ON TABLE "user_profiles" IS 'Extended user profile information';
      COMMENT ON TABLE "payment_details" IS 'User payment method preferences';
      COMMENT ON TABLE "auth_providers" IS 'OAuth provider connections for users';
      COMMENT ON TABLE "otps" IS 'One-time password verification records';
      COMMENT ON TABLE "brand_categories" IS 'Brand classification categories';
      COMMENT ON TABLE "brands" IS 'Partner brands with earning/redemption rules';
      COMMENT ON TABLE "coin_balances" IS 'Current coin balance per user';
      COMMENT ON TABLE "coin_transactions" IS 'All coin earning and redemption transactions';
      COMMENT ON TABLE "global_config" IS 'System-wide configuration settings';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all column comments
    await queryRunner.query(`
      COMMENT ON COLUMN "users"."id" IS NULL;
      COMMENT ON COLUMN "user_profiles"."id" IS NULL;
      COMMENT ON COLUMN "user_profiles"."userId" IS NULL;
      COMMENT ON COLUMN "payment_details"."id" IS NULL;
      COMMENT ON COLUMN "payment_details"."userId" IS NULL;
      COMMENT ON COLUMN "auth_providers"."id" IS NULL;
      COMMENT ON COLUMN "auth_providers"."userId" IS NULL;
      COMMENT ON COLUMN "otps"."id" IS NULL;
      COMMENT ON COLUMN "brand_categories"."id" IS NULL;
      COMMENT ON COLUMN "brands"."id" IS NULL;
      COMMENT ON COLUMN "brands"."categoryId" IS NULL;
      COMMENT ON COLUMN "brands"."minRedemptionAmount" IS NULL;
      COMMENT ON COLUMN "brands"."maxRedemptionAmount" IS NULL;
      COMMENT ON COLUMN "brands"."brandwiseMaxCap" IS NULL;
      COMMENT ON COLUMN "coin_balances"."id" IS NULL;
      COMMENT ON COLUMN "coin_balances"."userId" IS NULL;
      COMMENT ON COLUMN "coin_transactions"."id" IS NULL;
      COMMENT ON COLUMN "coin_transactions"."userId" IS NULL;
      COMMENT ON COLUMN "coin_transactions"."brandId" IS NULL;
      COMMENT ON COLUMN "global_config"."id" IS NULL;
    `);

    // Remove table-level comments
    await queryRunner.query(`
      COMMENT ON TABLE "users" IS NULL;
      COMMENT ON TABLE "user_profiles" IS NULL;
      COMMENT ON TABLE "payment_details" IS NULL;
      COMMENT ON TABLE "auth_providers" IS NULL;
      COMMENT ON TABLE "otps" IS NULL;
      COMMENT ON TABLE "brand_categories" IS NULL;
      COMMENT ON TABLE "brands" IS NULL;
      COMMENT ON TABLE "coin_balances" IS NULL;
      COMMENT ON TABLE "coin_transactions" IS NULL;
      COMMENT ON TABLE "global_config" IS NULL;
    `);
  }
}
