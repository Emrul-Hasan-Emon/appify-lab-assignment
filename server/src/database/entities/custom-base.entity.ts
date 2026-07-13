import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Not decorated with @Entity() on purpose - TypeORM flattens these columns into
// whichever concrete, @Entity()-decorated class extends it (its own table, no base table).
export abstract class CustomBase {
  // numeric key: what relations/foreign keys use for now
  @PrimaryGeneratedColumn('increment')
  id: number;

  // stable public identifier, safe to expose externally without leaking row counts/order
  @Generated('uuid')
  @Column({ type: 'uuid', unique: true })
  uuid: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;
}
