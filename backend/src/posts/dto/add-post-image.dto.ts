import { Matches } from 'class-validator';

export class AddPostImageDto {
  @Matches(/^\/uploads\/posts\/[A-Za-z0-9._-]+$/, {
    message: 'The image URL must be a local post upload path',
  })
  url!: string;
}
