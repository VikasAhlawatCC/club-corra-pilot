import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserRoles1700000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the roles column already exists
    const table = await queryRunner.getTable('users');
    const rolesColumn = table.findColumnByName('roles');
    
    if (!rolesColumn) {
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    const rolesColumn = table.findColumnByName('roles');
    
    if (rolesColumn) {
      await queryRunner.dropColumn('users', 'roles');
    }
  }
}
