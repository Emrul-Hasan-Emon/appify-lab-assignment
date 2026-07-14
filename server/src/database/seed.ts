import 'dotenv/config';
import { DataSource } from 'typeorm';
import {
  Comment,
  CommentLike,
  Post,
  PostLike,
  PostMedia,
  User,
} from './entities';
import { MediaType } from './enums/media-type.enum';
import { PostVisibility } from './enums/post-visibility.enum';

const SEED_USERS = [
  { firstName: 'Alice', lastName: 'Nguyen', email: 'seed.alice@example.com' },
  { firstName: 'Ben', lastName: 'Carter', email: 'seed.ben@example.com' },
  { firstName: 'Chloe', lastName: 'Dubois', email: 'seed.chloe@example.com' },
  { firstName: 'David', lastName: 'Okafor', email: 'seed.david@example.com' },
  { firstName: 'Emma', lastName: 'Rossi', email: 'seed.emma@example.com' },
];

const SEED_PASSWORD = 'password123';

const SAMPLE_TEXTS = [
  'Just shipped a new feature, feeling great!',
  'Beautiful morning for a walk.',
  'Anyone else excited about the new season?',
  'Working on a side project this weekend.',
  'Coffee first, code later.',
  'Loving the new office setup.',
  'Quick thought: always write tests.',
  'Weekend hike recommendations?',
  'Finally finished reading that book.',
  'Excited to share something soon!',
  'Refactored a gnarly module today, feels good.',
  'Trying out a new keyboard layout.',
  'Rainy day, perfect for deep work.',
  'Shoutout to the team for shipping on time.',
  'Anyone using the new database indexes trick?',
  'Coffee shop coding session in progress.',
  'Just hit a personal running record!',
  'Thinking about picking up a new hobby.',
  'Late night debugging session, but we found it.',
  'Happy to finally launch this project.',
];

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [User, Post, PostMedia, Comment, PostLike, CommentLike],
    synchronize: false,
  });
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const postRepo = dataSource.getRepository(Post);
  const mediaRepo = dataSource.getRepository(PostMedia);
  const commentRepo = dataSource.getRepository(Comment);
  const postLikeRepo = dataSource.getRepository(PostLike);

  const users: User[] = [];
  for (const seedUser of SEED_USERS) {
    let user = await userRepo.findOne({ where: { email: seedUser.email } });
    if (!user) {
      user = userRepo.create({ ...seedUser, password: SEED_PASSWORD });
      await userRepo.save(user); // @BeforeInsert hashes the password
    }
    users.push(user);
  }

  const posts: Post[] = [];
  for (let i = 0; i < SAMPLE_TEXTS.length; i++) {
    const author = users[i % users.length];
    const visibility =
      i % 5 === 0 ? PostVisibility.PRIVATE : PostVisibility.PUBLIC;

    const post = postRepo.create({
      authorId: author.id,
      text: SAMPLE_TEXTS[i],
      visibility,
    });
    await postRepo.save(post);
    posts.push(post);

    if (i % 3 === 0) {
      const media = mediaRepo.create({
        postId: post.id,
        mediaUrl: `https://picsum.photos/seed/post${post.id}/600/400`,
        mediaPath: `seed/post${post.id}`,
        mediaType: MediaType.IMAGE,
      });
      await mediaRepo.save(media);
    }
  }

  for (const post of posts) {
    const commenters = users.filter((u) => u.id !== post.authorId).slice(0, 2);

    for (const commenter of commenters) {
      const comment = commentRepo.create({
        postId: post.id,
        authorId: commenter.id,
        content: 'Nice post!',
      });
      await commentRepo.save(comment);
      await postRepo.increment({ id: post.id }, 'commentsCount', 1);

      const replier = users.find(
        (u) => u.id !== commenter.id && u.id !== post.authorId,
      );
      if (replier) {
        const reply = commentRepo.create({
          postId: post.id,
          authorId: replier.id,
          parentId: comment.id,
          content: 'Totally agree!',
        });
        await commentRepo.save(reply);
        await postRepo.increment({ id: post.id }, 'commentsCount', 1);
        await commentRepo.increment({ id: comment.id }, 'repliesCount', 1);
      }
    }
  }

  for (const post of posts) {
    const likers = users.filter((u) => u.id !== post.authorId).slice(0, 3);
    for (const liker of likers) {
      const existing = await postLikeRepo.findOne({
        where: { postId: post.id, userId: liker.id },
      });
      if (!existing) {
        await postLikeRepo.save(
          postLikeRepo.create({ postId: post.id, userId: liker.id }),
        );
        await postRepo.increment({ id: post.id }, 'likesCount', 1);
      }
    }
  }

  console.log(
    `Seeded ${users.length} users and ${posts.length} posts (with comments, replies, and likes).`,
  );
  console.log(`Login with any seed user, password: "${SEED_PASSWORD}"`);
  SEED_USERS.forEach((u) => console.log(`  - ${u.email}`));

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
