import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { MediaType } from '../enums/media-type.enum';
import { CustomBase } from './custom-base.entity';
import { Post } from './post.entity';

@Entity()
export class PostMedia extends CustomBase {
  @ManyToOne(() => Post, (post) => post.medias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column()
  @Index()
  postId: number;

  // present once the upload finishes; Cloudinary public id, used to delete the underlying file
  @Column({ nullable: true })
  mediaPath?: string;

  // publicly accessible URL served to clients
  @Column({ nullable: true })
  mediaUrl?: string;

  @Column({ type: 'enum', enum: MediaType, nullable: true })
  mediaType?: MediaType;
}
