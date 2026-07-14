import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Comment, DatabaseService, Post, User } from '../database';
import { PostVisibility } from '../database/enums/post-visibility.enum';
import { CreateCommentDto, UpdateCommentDto } from './dto';

@Injectable()
export class CommentsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(user: User, post: Post, dto: CreateCommentDto) {
    let parent: Comment | null = null;
    if (dto.parentId) {
      parent = await this.databaseService.comments.findOne({
        where: { id: dto.parentId, postId: post.id },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = this.databaseService.comments.create({
      postId: post.id,
      authorId: user.id,
      content: dto.content,
      parentId: parent?.id ?? null,
    });
    await this.databaseService.comments.save(comment);
    comment.author = user;

    await this.databaseService.posts.increment(
      { id: post.id },
      'commentsCount',
      1,
    );
    if (parent) {
      await this.databaseService.comments.increment(
        { id: parent.id },
        'repliesCount',
        1,
      );
    }

    return this.toResponse(comment, false);
  }

  async listForPost(user: User, post: Post) {
    const comments = await this.databaseService.comments.find({
      where: { postId: post.id },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });

    const likedIds = await this.likedCommentIds(
      user.id,
      comments.map((c) => c.id),
    );

    return comments.map((comment) =>
      this.toResponse(comment, likedIds.has(comment.id)),
    );
  }

  async update(user: User, commentId: number, dto: UpdateCommentDto) {
    const comment = await this.findOwned(user, commentId);
    comment.content = dto.content;
    comment.isEdited = true;
    await this.databaseService.comments.save(comment);
    return this.toResponse(comment, false);
  }

  async remove(user: User, commentId: number) {
    const comment = await this.findOwned(user, commentId);

    const rows = await this.databaseService.comments.query<{ count: number }[]>(
      `WITH RECURSIVE descendants AS (
         SELECT id FROM comments WHERE id = $1
         UNION ALL
         SELECT c.id FROM comments c INNER JOIN descendants d ON c."parentId" = d.id
       )
       SELECT count(*)::int AS count FROM descendants`,
      [comment.id],
    );
    const count = rows[0].count;

    await this.databaseService.posts.decrement(
      { id: comment.postId },
      'commentsCount',
      count,
    );
    if (comment.parentId) {
      await this.databaseService.comments.decrement(
        { id: comment.parentId },
        'repliesCount',
        1,
      );
    }

    // hard delete (not softRemove) so Postgres' ON DELETE CASCADE removes every descendant reply
    await this.databaseService.comments.delete({ id: comment.id });
  }

  async like(user: User, commentId: number) {
    const comment = await this.findAccessible(user, commentId);

    const existing = await this.databaseService.commentLikes.findOne({
      where: { commentId: comment.id, userId: user.id },
    });
    if (!existing) {
      await this.databaseService.commentLikes.save(
        this.databaseService.commentLikes.create({
          commentId: comment.id,
          userId: user.id,
        }),
      );
      await this.databaseService.comments.increment(
        { id: comment.id },
        'likesCount',
        1,
      );
    }

    return { liked: true };
  }

  async unlike(user: User, commentId: number) {
    const comment = await this.findAccessible(user, commentId);

    const existing = await this.databaseService.commentLikes.findOne({
      where: { commentId: comment.id, userId: user.id },
    });
    if (existing) {
      await this.databaseService.commentLikes.delete({ id: existing.id });
      await this.databaseService.comments.decrement(
        { id: comment.id },
        'likesCount',
        1,
      );
    }

    return { liked: false };
  }

  async listLikes(user: User, commentId: number) {
    await this.findAccessible(user, commentId);

    const likes = await this.databaseService.commentLikes.find({
      where: { commentId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    return likes.map((like) => ({
      id: like.user.id,
      firstName: like.user.firstName,
      lastName: like.user.lastName,
    }));
  }

  private async findOwned(user: User, commentId: number) {
    const comment = await this.databaseService.comments.findOne({
      where: { id: commentId },
      relations: { author: true },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== user.id) {
      throw new ForbiddenException('You do not own this comment');
    }
    return comment;
  }

  private async findAccessible(user: User, commentId: number) {
    const comment = await this.databaseService.comments.findOne({
      where: { id: commentId },
      relations: { post: true },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (
      comment.post.visibility === PostVisibility.PRIVATE &&
      comment.post.authorId !== user.id
    ) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  private async likedCommentIds(userId: number, commentIds: number[]) {
    if (!commentIds.length) {
      return new Set<number>();
    }
    const likes = await this.databaseService.commentLikes.find({
      where: commentIds.map((commentId) => ({ commentId, userId })),
    });
    return new Set(likes.map((like) => like.commentId));
  }

  private toResponse(comment: Comment, likedByMe: boolean) {
    return {
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId ?? null,
      content: comment.content,
      isEdited: comment.isEdited,
      likesCount: comment.likesCount,
      repliesCount: comment.repliesCount,
      likedByMe,
      createdAt: comment.createdAt,
      author: {
        id: comment.author.id,
        firstName: comment.author.firstName,
        lastName: comment.author.lastName,
      },
    };
  }
}
