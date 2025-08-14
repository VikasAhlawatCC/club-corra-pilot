import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWelcomeBonusConstraint1700000000003 implements MigrationInterface {
  name = 'AddWelcomeBonusConstraint1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add unique constraint to prevent duplicate welcome bonuses per user
    // Using a unique index instead of constraint for better PostgreSQL compatibility
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_coin_transactions_user_welcome_bonus" 
      ON "coin_transactions" ("userId", "type") 
      WHERE "type" = 'WELCOME_BONUS'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the unique index
    await queryRunner.query(`
      DROP INDEX "UQ_coin_transactions_user_welcome_bonus"
    `);
  }
}
