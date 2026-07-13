import * as bcrypt from 'bcryptjs';
import { BeforeInsert, Column, Entity } from 'typeorm';
import { CustomBase } from './custom-base.entity';

@Entity()
export class User extends CustomBase {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  // excluded from default SELECTs; opt in with .addSelect('user.password') to authenticate
  @Column({ select: false })
  password: string;

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    this.password = await bcrypt.hash(this.password, 12);
  }

  comparePassword(candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.password);
  }
}
