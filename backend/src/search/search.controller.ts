import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/search') // final route: GET /api/search (if main.ts has setGlobalPrefix('api'))
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }
}