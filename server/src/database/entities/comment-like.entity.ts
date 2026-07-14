import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Comment } from './comment.entity';
import { CustomBase } from './custom-base.entity';
import { User } from './user.entity';

@Entity('comment_likes')
@Unique(['commentId', 'userId'])
export class CommentLike extends CustomBase {
  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  @Column()
  @Index()
  commentId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}
