import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddBrandsAndCoins1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create brand_categories table
    await queryRunner.createTable(
      new Table({
        name: 'brand_categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7',
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

    // Create brands table
    await queryRunner.createTable(
      new Table({
        name: 'brands',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'logoUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'categoryId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'earningPercentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'redemptionPercentage',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'minRedemptionAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'maxRedemptionAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
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

    // Create coin_balances table
    await queryRunner.createTable(
      new Table({
        name: 'coin_balances',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'balance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'lastUpdated',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
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

    // Create coin_transactions table
    await queryRunner.createTable(
      new Table({
        name: 'coin_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['WELCOME_BONUS', 'EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTMENT'],
            isNullable: false,
          },
          {
            name: 'brandId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'referenceId',
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

    // Create foreign key constraints
    await queryRunner.createForeignKey(
      'brands',
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'brand_categories',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'coin_balances',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'coin_transactions',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'coin_transactions',
      new TableForeignKey({
        columnNames: ['brandId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'brands',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    // Create indexes for better performance
    await queryRunner.createIndex(
      'brands',
      new TableIndex({
        name: 'IDX_BRANDS_CATEGORY_ID',
        columnNames: ['categoryId'],
      }),
    );

    await queryRunner.createIndex(
      'brands',
      new TableIndex({
        name: 'IDX_BRANDS_IS_ACTIVE',
        columnNames: ['isActive'],
      }),
    );

    await queryRunner.createIndex(
      'coin_transactions',
      new TableIndex({
        name: 'IDX_COIN_TRANSACTIONS_USER_ID',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'coin_transactions',
      new TableIndex({
        name: 'IDX_COIN_TRANSACTIONS_TYPE',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'coin_transactions',
      new TableIndex({
        name: 'IDX_COIN_TRANSACTIONS_BRAND_ID',
        columnNames: ['brandId'],
      }),
    );

    await queryRunner.createIndex(
      'coin_transactions',
      new TableIndex({
        name: 'IDX_COIN_TRANSACTIONS_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );

    // Additional index for coin balance queries
    await queryRunner.createIndex(
      'coin_balances',
      new TableIndex({
        name: 'IDX_COIN_BALANCES_LAST_UPDATED',
        columnNames: ['lastUpdated'],
      }),
    );

    // Composite index for better transaction queries
    await queryRunner.createIndex(
      'coin_transactions',
      new TableIndex({
        name: 'IDX_COIN_TRANSACTIONS_USER_TYPE',
        columnNames: ['userId', 'type'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex('coin_transactions', 'IDX_COIN_TRANSACTIONS_USER_TYPE');
    await queryRunner.dropIndex('coin_balances', 'IDX_COIN_BALANCES_LAST_UPDATED');
    await queryRunner.dropIndex('coin_transactions', 'IDX_COIN_TRANSACTIONS_CREATED_AT');
    await queryRunner.dropIndex('coin_transactions', 'IDX_COIN_TRANSACTIONS_BRAND_ID');
    await queryRunner.dropIndex('coin_transactions', 'IDX_COIN_TRANSACTIONS_TYPE');
    await queryRunner.dropIndex('coin_transactions', 'IDX_COIN_TRANSACTIONS_USER_ID');
    await queryRunner.dropIndex('brands', 'IDX_BRANDS_IS_ACTIVE');
    await queryRunner.dropIndex('brands', 'IDX_BRANDS_CATEGORY_ID');

    // Drop foreign keys
    const brandsTable = await queryRunner.getTable('brands');
    const coinBalancesTable = await queryRunner.getTable('coin_balances');
    const coinTransactionsTable = await queryRunner.getTable('coin_transactions');

    if (brandsTable) {
      const foreignKey = brandsTable.foreignKeys.find(fk => fk.columnNames.indexOf('categoryId') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('brands', foreignKey);
      }
    }

    if (coinBalancesTable) {
      const foreignKey = coinBalancesTable.foreignKeys.find(fk => fk.columnNames.indexOf('userId') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('coin_balances', foreignKey);
      }
    }

    if (coinTransactionsTable) {
      const foreignKeys = coinTransactionsTable.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('coin_transactions', foreignKey);
      }
    }

    // Drop tables
    await queryRunner.dropTable('coin_transactions');
    await queryRunner.dropTable('coin_balances');
    await queryRunner.dropTable('brands');
    await queryRunner.dropTable('brand_categories');
  }
}
