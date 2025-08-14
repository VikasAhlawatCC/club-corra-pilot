import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1700000000002 implements MigrationInterface {
  name = 'AddPerformanceIndexes1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add composite index for coin transactions by user and type
    await queryRunner.query(`
      CREATE INDEX "IDX_coin_transactions_user_type" 
      ON "coin_transactions" ("userId", "type")
    `);

    // Add composite index for coin transactions by user and creation date
    await queryRunner.query(`
      CREATE INDEX "IDX_coin_transactions_user_created" 
      ON "coin_transactions" ("userId", "createdAt" DESC)
    `);

    // Add index for coin transactions by brand
    await queryRunner.query(`
      CREATE INDEX "IDX_coin_transactions_brand" 
      ON "coin_transactions" ("brandId")
    `);

    // Add index for brands by category and active status
    await queryRunner.query(`
      CREATE INDEX "IDX_brands_category_active" 
      ON "brands" ("categoryId", "isActive")
    `);

    // Add index for brands by active status
    await queryRunner.query(`
      CREATE INDEX "IDX_brands_active" 
      ON "brands" ("isActive")
    `);

    // Add index for coin balance by user
    await queryRunner.query(`
      CREATE INDEX "IDX_coin_balance_user" 
      ON "coin_balances" ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all created indexes
    await queryRunner.query(`DROP INDEX "IDX_coin_transactions_user_type"`);
    await queryRunner.query(`DROP INDEX "IDX_coin_transactions_user_created"`);
    await queryRunner.query(`DROP INDEX "IDX_coin_transactions_brand"`);
    await queryRunner.query(`DROP INDEX "IDX_brands_category_active"`);
    await queryRunner.query(`DROP INDEX "IDX_brands_active"`);
    await queryRunner.query(`DROP INDEX "IDX_coin_balance_user"`);
  }
}
