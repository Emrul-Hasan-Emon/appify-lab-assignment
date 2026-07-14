import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser, JwtAuthGuard } from '../auth';
import { CommentsService } from '../comments/comments.service';
import { CreateCommentDto } from '../comments/dto';
import { User } from '../database';
import { CreatePostDto, FeedQueryDto } from './dto';
import { PostsService } from './posts.service';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('media', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  create(
    @CurrentUser() user: User,
    @Body() dto: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.postsService.create(user, dto, files);
  }

  @Get()
  findAll(@CurrentUser() user: User, @Query() query: FeedQueryDto) {
    return this.postsService.findAll(user, query);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.postsService.findOne(user, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.postsService.remove(user, id);
  }

  @Delete(':id/media/:mediaId')
  removeMedia(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
  ) {
    return this.postsService.removeMedia(user, id, mediaId);
  }

  @Post(':id/like')
  like(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.postsService.like(user, id);
  }

  @Delete(':id/like')
  unlike(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.postsService.unlike(user, id);
  }

  @Get(':id/likes')
  listLikes(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.postsService.listLikes(user, id);
  }

  @Post(':id/comments')
  async addComment(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
  ) {
    const post = await this.postsService.findVisible(user, id);
    return this.commentsService.create(user, post, dto);
  }

  @Get(':id/comments')
  async listComments(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const post = await this.postsService.findVisible(user, id);
    return this.commentsService.listForPost(user, post);
  }
}
