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
      useFactory: (config: ConfigService) => {
        // DB_SYNCHRONIZE lets a temporary/demo deploy opt into schema auto-sync even with
        // NODE_ENV=production; a real production deploy should use generated migrations instead
        const synchronizeOverride = config.get<string>('DB_SYNCHRONIZE');
        const synchronize =
          synchronizeOverride !== undefined
            ? synchronizeOverride === 'true'
            : config.get<string>('NODE_ENV') !== 'production';

        return {
          type: 'postgres' as const,
          url: config.get<string>('DATABASE_URL'),
          entities,
          synchronize,
          ssl:
            config.get<string>('DB_SSL') === 'true'
              ? { rejectUnauthorized: false }
              : undefined,
        };
      },
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
