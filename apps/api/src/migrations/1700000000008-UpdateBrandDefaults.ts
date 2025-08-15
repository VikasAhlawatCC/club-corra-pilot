import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBrandDefaults1700000000008 implements MigrationInterface {
  name = 'UpdateBrandDefaults1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update existing brands to have the new default values
    // Only update brands that haven't been customized (keeping existing custom values)
    
    // Update earning percentage to 10% for brands that still have the old default of 30%
    await queryRunner.query(`
      UPDATE brands 
      SET "earningPercentage" = 10 
      WHERE "earningPercentage" = 30 
      AND "updatedAt" = "createdAt"
    `);
    
    // Update redemption percentage to 30% for brands that still have the old default of 100%
    await queryRunner.query(`
      UPDATE brands 
      SET "redemptionPercentage" = 30 
      WHERE "redemptionPercentage" = 100 
      AND "updatedAt" = "createdAt"
    `);
    
    // Update minRedemptionAmount to 1 for brands that don't have it set
    await queryRunner.query(`
      UPDATE brands 
      SET "minRedemptionAmount" = 1 
      WHERE "minRedemptionAmount" IS NULL OR "minRedemptionAmount" = 0
    `);
    
    // Update maxRedemptionAmount to 2000 for brands that don't have it set
    await queryRunner.query(`
      UPDATE brands 
      SET "maxRedemptionAmount" = 2000 
      WHERE "maxRedemptionAmount" IS NULL OR "maxRedemptionAmount" = 0
    `);
    
    // Update brandwiseMaxCap to 2000 for brands that don't have it set
    await queryRunner.query(`
      UPDATE brands 
      SET "brandwiseMaxCap" = 2000 
      WHERE "brandwiseMaxCap" IS NULL OR "brandwiseMaxCap" = 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to old defaults if needed
    await queryRunner.query(`
      UPDATE brands 
      SET "earningPercentage" = 30 
      WHERE "earningPercentage" = 10 
      AND "updatedAt" = "createdAt"
    `);
    
    await queryRunner.query(`
      UPDATE brands 
      SET "redemptionPercentage" = 100 
      WHERE "redemptionPercentage" = 30 
      AND "updatedAt" = "createdAt"
    `);
  }
}
