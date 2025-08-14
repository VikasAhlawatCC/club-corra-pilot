import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdatePaymentDetailsAndBrandsSchema1700000000007 implements MigrationInterface {
  name = 'UpdatePaymentDetailsAndBrandsSchema1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add mobile number column to payment_details table
    await queryRunner.addColumn(
      'payment_details',
      new TableColumn({
        name: 'mobileNumber',
        type: 'varchar',
        length: '15',
        isNullable: true,
        comment: 'Mobile number associated with payment method',
      }),
    );

    // Remove overallMaxCap column from brands table
    await queryRunner.dropColumn('brands', 'overallMaxCap');

    // Update default values for brands table
    await queryRunner.query(`
      ALTER TABLE "brands" 
      ALTER COLUMN "minRedemptionAmount" SET DEFAULT 1
    `);

    await queryRunner.query(`
      ALTER TABLE "brands" 
      ALTER COLUMN "maxRedemptionAmount" SET DEFAULT 2000
    `);

    // Add comment to clarify that maxRedemptionAmount and brandwiseMaxCap are the same
    await queryRunner.query(`
      COMMENT ON COLUMN "brands"."maxRedemptionAmount" IS 'Maximum amount that can be redeemed (same as brandwiseMaxCap)';
      COMMENT ON COLUMN "brands"."brandwiseMaxCap" IS 'Per-transaction maximum redemption limit (same as maxRedemptionAmount)';
    `);

    // Add new global config for overall max cap (moved from brands table)
    await queryRunner.query(`
      INSERT INTO global_config (key, value, description, type, "isEditable", category) VALUES
      ('DEFAULT_OVERALL_MAX_CAP', '2000', 'Default brand-wide maximum redemption limit in coins (moved from brands table)', 'number', true, 'brand')
      ON CONFLICT (key) DO UPDATE SET 
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        "updatedAt" = CURRENT_TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove mobile number column from payment_details table
    await queryRunner.dropColumn('payment_details', 'mobileNumber');

    // Add back overallMaxCap column to brands table
    await queryRunner.addColumn(
      'brands',
      new TableColumn({
        name: 'overallMaxCap',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 2000,
        comment: 'Brand-wide maximum redemption limit',
      }),
    );

    // Reset default values for brands table
    await queryRunner.query(`
      ALTER TABLE "brands" 
      ALTER COLUMN "minRedemptionAmount" SET DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "brands" 
      ALTER COLUMN "maxRedemptionAmount" SET DEFAULT 0
    `);

    // Remove comments
    await queryRunner.query(`
      COMMENT ON COLUMN "brands"."maxRedemptionAmount" IS NULL;
      COMMENT ON COLUMN "brands"."brandwiseMaxCap" IS NULL;
    `);

    // Remove the global config entry
    await queryRunner.query(`
      DELETE FROM global_config WHERE key = 'DEFAULT_OVERALL_MAX_CAP'
    `);
  }
}
