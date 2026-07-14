import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Comment,
  CommentLike,
  Post,
  PostLike,
  PostMedia,
  User,
} from './entities';

// Single access point for every repository - feature modules inject DatabaseService
// instead of each declaring their own @InjectRepository(...).
@Injectable()
export class DatabaseService implements OnApplicationBootstrap {
  users: Repository<User>;
  posts: Repository<Post>;
  postMedia: Repository<PostMedia>;
  comments: Repository<Comment>;
  postLikes: Repository<PostLike>;
  commentLikes: Repository<CommentLike>;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostMedia)
    private readonly postMediaRepository: Repository<PostMedia>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepository: Repository<CommentLike>,
  ) {}

  onApplicationBootstrap() {
    this.users = this.userRepository;
    this.posts = this.postRepository;
    this.postMedia = this.postMediaRepository;
    this.comments = this.commentRepository;
    this.postLikes = this.postLikeRepository;
    this.commentLikes = this.commentLikeRepository;
  }
}
