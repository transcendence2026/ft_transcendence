import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AddPostImageDto } from './dto/add-post-image.dto.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { PostsService } from './posts.service.js';

@Controller('api/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll() { return this.postsService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.postsService.findOne(id); }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreatePostDto) { return this.postsService.create(req.user.id, dto); }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) { return this.postsService.remove(id, req.user.id); }

  @UseGuards(JwtAuthGuard)
  @Post(':id/images')
  addImage(@Param('id') id: string, @Req() req: any, @Body() dto: AddPostImageDto) {
    return this.postsService.addImage(id, req.user.id, dto.url);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/images/:imageId')
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string, @Req() req: any) {
    return this.postsService.removeImage(id, imageId, req.user.id);
  }
}
