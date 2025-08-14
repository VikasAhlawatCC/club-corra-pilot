import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddBrandCapsAndPaymentTracking1700000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to brands table
    await queryRunner.addColumns('brands', [
      new TableColumn({
        name: 'overallMaxCap',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        comment: 'Brand-wide maximum redemption limit',
      }),
      new TableColumn({
        name: 'brandwiseMaxCap',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        comment: 'Per-transaction maximum redemption limit',
      }),
    ]);

    // Add new columns to coin_transactions table
    await queryRunner.addColumns('coin_transactions', [
      new TableColumn({
        name: 'transactionId',
        type: 'varchar',
        length: '100',
        isNullable: true,
        comment: 'Admin payment tracking ID',
      }),
      new TableColumn({
        name: 'billDate',
        type: 'date',
        isNullable: true,
        comment: 'Receipt date for validation',
      }),
      new TableColumn({
        name: 'paymentProcessedAt',
        type: 'timestamp',
        isNullable: true,
        comment: 'Payment completion timestamp',
      }),
    ]);

    // Note: Status enum will be handled by entity definition
    // The 'PAID' status is already defined in the entity

    // Add indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_COIN_TRANSACTIONS_TRANSACTION_ID" ON "coin_transactions" ("transactionId");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_COIN_TRANSACTIONS_BILL_DATE" ON "coin_transactions" ("billDate");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_COIN_TRANSACTIONS_PAYMENT_PROCESSED" ON "coin_transactions" ("paymentProcessedAt");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_BRANDS_OVERALL_MAX_CAP" ON "brands" ("overallMaxCap");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_BRANDS_BRANDWISE_MAX_CAP" ON "brands" ("brandwiseMaxCap");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.dropIndex('coin_transactions', 'IDX_COIN_TRANSACTIONS_TRANSACTION_ID');
    await queryRunner.dropIndex('coin_transactions', 'IDX_COIN_TRANSACTIONS_BILL_DATE');
    await queryRunner.dropIndex('coin_transactions', 'IDX_COIN_TRANSACTIONS_PAYMENT_PROCESSED');
    await queryRunner.dropIndex('brands', 'IDX_BRANDS_OVERALL_MAX_CAP');
    await queryRunner.dropIndex('brands', 'IDX_BRANDS_BRANDWISE_MAX_CAP');

    // Remove columns from coin_transactions table
    await queryRunner.dropColumns('coin_transactions', [
      'transactionId',
      'billDate',
      'paymentProcessedAt',
    ]);

    // Remove columns from brands table
    await queryRunner.dropColumns('brands', [
      'overallMaxCap',
      'brandwiseMaxCap',
    ]);

    // Note: Cannot easily remove enum values in PostgreSQL, so we'll leave the PAID status
    // This is a limitation of PostgreSQL and would require more complex migration logic
  }
}
