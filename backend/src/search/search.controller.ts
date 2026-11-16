import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SearchService } from './search.service.js';
import { SearchQueryDto } from './dto/search-query.dto.js';
import { UserSearchQueryDto } from './dto/user-search-query.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('api/search') // final route: GET /api/search (if main.ts has setGlobalPrefix('api'))
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }

  @Get('users')
  searchUsers(
    @Req() req: { user: { id: string } },
    @Query() query: UserSearchQueryDto,
  ) {
    return this.searchService.searchUsers(req.user.id, query);
  }
}