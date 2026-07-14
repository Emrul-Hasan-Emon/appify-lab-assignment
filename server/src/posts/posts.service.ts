import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService, Post, User } from '../database';
import { PostVisibility } from '../database/enums/post-visibility.enum';
import { UploadService } from '../upload/upload.service';
import { CreatePostDto, FeedQueryDto } from './dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly uploadService: UploadService,
  ) {}

  async create(
    user: User,
    dto: CreatePostDto,
    files: Express.Multer.File[] = [],
  ) {
    const post = this.databaseService.posts.create({
      authorId: user.id,
      text: dto.text,
      visibility: dto.visibility ?? PostVisibility.PUBLIC,
    });
    await this.databaseService.posts.save(post);

    if (files.length) {
      const uploads = await Promise.all(
        files.map((file) => this.uploadService.uploadFile(file)),
      );
      const media = uploads.map((upload) =>
        this.databaseService.postMedia.create({
          postId: post.id,
          ...upload,
        }),
      );
      await this.databaseService.postMedia.save(media);
      post.medias = media;
    } else {
      post.medias = [];
    }

    post.author = user;
    return this.toResponse(post, false);
  }

  async findAll(user: User, query: FeedQueryDto) {
    const limit = query.limit ?? 10;

    const qb = this.databaseService.posts
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.medias', 'medias')
      .where('(post.visibility = :public OR post.authorId = :userId)', {
        public: PostVisibility.PUBLIC,
        userId: user.id,
      })
      .orderBy('post.id', 'DESC')
      .take(limit + 1);

    if (query.cursor) {
      qb.andWhere('post.id < :cursor', { cursor: query.cursor });
    }

    const posts = await qb.getMany();
    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    const likedIds = await this.likedPostIds(
      user.id,
      items.map((post) => post.id),
    );

    return {
      items: items.map((post) => this.toResponse(post, likedIds.has(post.id))),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async findOne(user: User, id: number) {
    const post = await this.findVisible(user, id);
    const likedIds = await this.likedPostIds(user.id, [post.id]);
    return this.toResponse(post, likedIds.has(post.id));
  }

  async remove(user: User, id: number) {
    const post = await this.findOwned(user, id);

    await Promise.all(
      (post.medias ?? []).map((media) =>
        this.uploadService.removeFile(media.mediaPath!, media.mediaType!),
      ),
    );

    // hard delete so ON DELETE CASCADE removes media, comments and likes together
    await this.databaseService.posts.delete({ id: post.id });
  }

  async removeMedia(user: User, postId: number, mediaId: number) {
    await this.findOwned(user, postId);

    const media = await this.databaseService.postMedia.findOne({
      where: { id: mediaId, postId },
    });
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (media.mediaPath && media.mediaType) {
      await this.uploadService.removeFile(media.mediaPath, media.mediaType);
    }
    await this.databaseService.postMedia.delete({ id: media.id });
  }

  async like(user: User, postId: number) {
    const post = await this.findVisible(user, postId);

    const existing = await this.databaseService.postLikes.findOne({
      where: { postId: post.id, userId: user.id },
    });
    if (!existing) {
      await this.databaseService.postLikes.save(
        this.databaseService.postLikes.create({
          postId: post.id,
          userId: user.id,
        }),
      );
      await this.databaseService.posts.increment(
        { id: post.id },
        'likesCount',
        1,
      );
    }

    return { liked: true };
  }

  async unlike(user: User, postId: number) {
    const post = await this.findVisible(user, postId);

    const existing = await this.databaseService.postLikes.findOne({
      where: { postId: post.id, userId: user.id },
    });
    if (existing) {
      await this.databaseService.postLikes.delete({ id: existing.id });
      await this.databaseService.posts.decrement(
        { id: post.id },
        'likesCount',
        1,
      );
    }

    return { liked: false };
  }

  async listLikes(user: User, postId: number) {
    await this.findVisible(user, postId);

    const likes = await this.databaseService.postLikes.find({
      where: { postId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    return likes.map((like) => ({
      id: like.user.id,
      firstName: like.user.firstName,
      lastName: like.user.lastName,
    }));
  }

  /** Loads a post visible to the given user (public, or private-and-owned); 404s otherwise. */
  async findVisible(user: User, id: number): Promise<Post> {
    const post = await this.databaseService.posts.findOne({
      where: { id },
      relations: { author: true, medias: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (
      post.visibility === PostVisibility.PRIVATE &&
      post.authorId !== user.id
    ) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  private async findOwned(user: User, id: number): Promise<Post> {
    const post = await this.databaseService.posts.findOne({
      where: { id },
      relations: { medias: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.authorId !== user.id) {
      throw new ForbiddenException('You do not own this post');
    }
    return post;
  }

  private async likedPostIds(userId: number, postIds: number[]) {
    if (!postIds.length) {
      return new Set<number>();
    }
    const likes = await this.databaseService.postLikes.find({
      where: postIds.map((postId) => ({ postId, userId })),
    });
    return new Set(likes.map((like) => like.postId));
  }

  private toResponse(post: Post, likedByMe: boolean) {
    return {
      id: post.id,
      text: post.text,
      visibility: post.visibility,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      likedByMe,
      createdAt: post.createdAt,
      author: {
        id: post.author.id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
      },
      media: (post.medias ?? []).map((media) => ({
        id: media.id,
        mediaUrl: media.mediaUrl,
        mediaType: media.mediaType,
      })),
    };
  }
}
