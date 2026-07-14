import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import {
  Comment,
  CommentLike,
  Post,
  PostLike,
  PostMedia,
  User,
} from './entities';

const entities = [User, Post, PostMedia, Comment, PostLike, CommentLike];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        entities,
        // safe for local development only; production should use generated migrations instead
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
