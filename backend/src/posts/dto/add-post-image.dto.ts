import { Matches } from 'class-validator';

export class AddPostImageDto {
  @Matches(/^(\/uploads\/posts\/[A-Za-z0-9._-]+|https?:\/\/[^\s]+)$/, {
    message: 'The image URL must be a local upload path or an HTTP(S) URL',
  })
  url!: string;
}
