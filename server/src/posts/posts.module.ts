import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommentsModule } from '../comments/comments.module';
import { DatabaseModule } from '../database';
import { UploadModule } from '../upload/upload.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [DatabaseModule, AuthModule, UploadModule, CommentsModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
