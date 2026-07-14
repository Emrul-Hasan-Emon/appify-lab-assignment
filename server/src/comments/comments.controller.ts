import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '../auth';
import { User } from '../database';
import { CommentsService } from './comments.service';
import { UpdateCommentDto } from './dto';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.commentsService.remove(user, id);
  }

  @Post(':id/like')
  like(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.commentsService.like(user, id);
  }

  @Delete(':id/like')
  unlike(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.commentsService.unlike(user, id);
  }

  @Get(':id/likes')
  listLikes(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.commentsService.listLikes(user, id);
  }
}
