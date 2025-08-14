import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateGlobalConfigTable1700000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create global_config table
    await queryRunner.createTable(
      new Table({
        name: 'global_config',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'value',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            default: "'string'",
          },
          {
            name: 'isEditable',
            type: 'boolean',
            default: false,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_GLOBAL_CONFIG_KEY" ON "global_config" ("key");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_GLOBAL_CONFIG_CATEGORY" ON "global_config" ("category");
    `);

    // Seed default configuration values
    await queryRunner.query(`
      INSERT INTO global_config (key, value, description, type, "isEditable", category) VALUES
      ('DEFAULT_EARNING_PERCENTAGE', '30', 'Default percentage of MRP earned as coins for new brands', 'number', true, 'brand'),
      ('DEFAULT_REDEMPTION_PERCENTAGE', '100', 'Default percentage of MRP that can be redeemed for new brands', 'number', true, 'brand'),
      ('DEFAULT_OVERALL_MAX_CAP', '2000', 'Default brand-wide maximum redemption limit in coins', 'number', true, 'brand'),
      ('DEFAULT_BRANDWISE_MAX_CAP', '2000', 'Default per-transaction maximum redemption limit in coins', 'number', true, 'brand'),
      ('WELCOME_BONUS_AMOUNT', '100', 'Number of coins awarded to new users upon signup', 'number', true, 'user'),
      ('MIN_BILL_AMOUNT', '10', 'Minimum bill amount required for earn requests', 'number', true, 'transaction'),
      ('MAX_BILL_AGE_DAYS', '30', 'Maximum age of bills in days for earn requests', 'number', true, 'transaction'),
      ('FRAUD_PREVENTION_HOURS', '24', 'Hours to wait before allowing another earn request for the same brand', 'number', true, 'security'),
      ('SYSTEM_MAINTENANCE_MODE', 'false', 'Enable/disable system maintenance mode', 'boolean', true, 'system'),
      ('MAX_FILE_SIZE_MB', '10', 'Maximum file size in MB for bill uploads', 'number', true, 'file'),
      ('ALLOWED_FILE_TYPES', '["image/jpeg", "image/png", "image/webp"]', 'Allowed file types for bill uploads', 'json', true, 'file')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.dropIndex('global_config', 'IDX_GLOBAL_CONFIG_KEY');
    await queryRunner.dropIndex('global_config', 'IDX_GLOBAL_CONFIG_CATEGORY');

    // Drop table
    await queryRunner.dropTable('global_config');
  }
}
