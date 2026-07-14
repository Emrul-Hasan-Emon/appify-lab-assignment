import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CustomBase } from './custom-base.entity';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity('post_likes')
@Unique(['postId', 'userId'])
export class PostLike extends CustomBase {
  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column()
  @Index()
  postId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}
