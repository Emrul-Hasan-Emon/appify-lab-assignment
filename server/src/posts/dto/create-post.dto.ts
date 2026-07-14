import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PostVisibility } from '../../database/enums/post-visibility.enum';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;
}
