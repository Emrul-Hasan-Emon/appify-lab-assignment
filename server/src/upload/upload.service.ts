import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinaryClient, UploadApiResponse } from 'cloudinary';
import { MediaType } from '../database/enums/media-type.enum';
import { CLOUDINARY } from './cloudinary.provider';

export interface UploadedMedia {
  mediaPath: string;
  mediaUrl: string;
  mediaType: MediaType;
}

@Injectable()
export class UploadService {
  constructor(
    @Inject(CLOUDINARY) private readonly cloudinary: typeof cloudinaryClient,
    private readonly config: ConfigService,
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<UploadedMedia> {
    const mediaType = file.mimetype.startsWith('video')
      ? MediaType.VIDEO
      : MediaType.IMAGE;
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const result: UploadApiResponse = await this.cloudinary.uploader.upload(
      dataUri,
      {
        folder: this.config.get<string>('CLOUDINARY_FOLDER'),
        resource_type: mediaType === MediaType.VIDEO ? 'video' : 'image',
      },
    );

    return {
      mediaPath: result.public_id,
      mediaUrl: result.secure_url,
      mediaType,
    };
  }

  async removeFile(mediaPath: string, mediaType: MediaType): Promise<void> {
    await this.cloudinary.uploader.destroy(mediaPath, {
      resource_type: mediaType === MediaType.VIDEO ? 'video' : 'image',
    });
  }
}
