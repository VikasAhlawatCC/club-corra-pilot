import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserRoles1700000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'roles',
        type: 'text',
        isArray: true,
        default: "'{USER}'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'roles');
  }
}
