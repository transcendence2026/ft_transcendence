import { IsUrl } from 'class-validator';

export class AddPostImageDto {
  @IsUrl()
  url!: string;
}
