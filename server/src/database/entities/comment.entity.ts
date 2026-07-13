import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { CustomBase } from './custom-base.entity';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity('comments')
@Index(['postId', 'parentId', 'createdAt'])
export class Comment extends CustomBase {
  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column()
  postId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: number;

  @Column({ type: 'text' })
  content: string;

  // null for a top-level comment on the post; set for a reply to another comment/reply.
  // onDelete: CASCADE means deleting a comment lets Postgres cascade the removal down
  // through every descendant reply automatically - no manual tree walk needed.
  @ManyToOne(() => Comment, (comment) => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent?: Comment | null;

  @Column({ nullable: true })
  parentId?: number | null;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @Column({ default: false })
  isEdited: boolean;

  // denormalized counters, kept in sync by the like/reply services instead of counting on every read
  @Column({ default: 0 })
  likesCount: number;

  // count of direct replies only (not the whole descendant subtree)
  @Column({ default: 0 })
  repliesCount: number;
}
