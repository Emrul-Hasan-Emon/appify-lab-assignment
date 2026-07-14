import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { PostVisibility } from '../enums/post-visibility.enum';
import { CustomBase } from './custom-base.entity';
import { PostMedia } from './post-media.entity';
import { User } from './user.entity';

@Entity()
// feed query is `WHERE visibility = 'public' OR authorId = :me ORDER BY id DESC` with an
// `id < cursor` cutoff - these composite indexes let Postgres satisfy both the filter and
// the sort/cursor for each branch of the OR without a full scan, even at massive row counts.
@Index(['visibility', 'id'])
@Index(['authorId', 'id'])
export class Post extends CustomBase {
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: number;

  @Column({ type: 'text', nullable: true })
  text?: string;

  // one post may carry several photos/videos; each is individually removable by its own row id
  @OneToMany(() => PostMedia, (media) => media.post, { cascade: true })
  medias: PostMedia[];

  @Column({
    type: 'enum',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  visibility: PostVisibility;

  // denormalized counters, kept in sync by the like/comment services instead of counting on every read
  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  commentsCount: number;
}
