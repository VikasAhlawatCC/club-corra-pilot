import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

@Entity('global_config')
export class GlobalConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'string' })
  type: 'string' | 'number' | 'boolean' | 'json';

  @Column({ type: 'boolean', default: false })
  isEditable: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  validateConfig() {
    if (!this.key || this.key.trim().length === 0) {
      throw new Error('Config key is required');
    }

    if (!this.value || this.value.trim().length === 0) {
      throw new Error('Config value is required');
    }
  }

  /**
   * Get typed value based on config type
   */
  getTypedValue(): string | number | boolean | any {
    switch (this.type) {
      case 'number':
        return parseFloat(this.value);
      case 'boolean':
        return this.value.toLowerCase() === 'true';
      case 'json':
        try {
          return JSON.parse(this.value);
        } catch {
          return this.value;
        }
      default:
        return this.value;
    }
  }

  /**
   * Set value with proper type conversion
   */
  setTypedValue(value: string | number | boolean | any): void {
    switch (this.type) {
      case 'number':
        this.value = value.toString();
        break;
      case 'boolean':
        this.value = value.toString();
        break;
      case 'json':
        this.value = JSON.stringify(value);
        break;
      default:
        this.value = value.toString();
    }
  }
}
