import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';

const reviewInclude = {
  author: { select: { id: true, username: true } },
  dish: { select: { id: true, name: true, restaurant: { select: { id: true, name: true } } } },
};

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(dishId?: string) {
    return this.prisma.review.findMany({
      where: dishId ? { dishId } : undefined,
      include: reviewInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id }, include: reviewInclude });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  async create(authorId: string, dto: CreateReviewDto) {
    try {
      return await this.prisma.review.create({
        data: { authorId, dishId: dto.dishId, rating: dto.rating, comment: dto.comment },
        include: reviewInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You have already reviewed this dish');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundException('Dish not found');
      }
      throw error;
    }
  }

  async update(id: string, authorId: string, dto: UpdateReviewDto) {
    await this.assertOwner(id, authorId);
    return this.prisma.review.update({ where: { id }, data: dto, include: reviewInclude });
  }

  async remove(id: string, authorId: string) {
    await this.assertOwner(id, authorId);
    return this.prisma.review.delete({ where: { id } });
  }

  private async assertOwner(id: string, authorId: string) {
    const review = await this.prisma.review.findUnique({ where: { id }, select: { authorId: true } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.authorId !== authorId) throw new ForbiddenException('You can only edit your own reviews');
  }
}
