import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPasswordAndEmailVerification1700000000008 implements MigrationInterface {
  name = 'AddPasswordAndEmailVerification1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add email verification columns
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'emailVerificationToken',
        type: 'varchar',
        isNullable: true,
        comment: 'Token for email verification flow',
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'emailVerificationExpiresAt',
        type: 'timestamp',
        isNullable: true,
        comment: 'Expiry timestamp for email verification token',
      }),
    );

    // Add password reset columns
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'passwordResetToken',
        type: 'varchar',
        isNullable: true,
        comment: 'Token for password reset functionality',
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'passwordResetExpiresAt',
        type: 'timestamp',
        isNullable: true,
        comment: 'Expiry timestamp for password reset token',
      }),
    );

    // Add comments to existing columns for clarity
    await queryRunner.query(`
      COMMENT ON COLUMN "users"."passwordHash" IS 'Hashed password using bcrypt for email login';
      COMMENT ON COLUMN "users"."isEmailVerified" IS 'Whether email has been verified through OTP or OAuth';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove email verification columns
    await queryRunner.dropColumn('users', 'emailVerificationToken');
    await queryRunner.dropColumn('users', 'emailVerificationExpiresAt');

    // Remove password reset columns
    await queryRunner.dropColumn('users', 'passwordResetToken');
    await queryRunner.dropColumn('users', 'passwordResetExpiresAt');

    // Remove comments from existing columns
    await queryRunner.query(`
      COMMENT ON COLUMN "users"."passwordHash" IS NULL;
      COMMENT ON COLUMN "users"."isEmailVerified" IS NULL;
    `);
  }
}
