import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [FilesController],
  providers: [], 
  exports: [],
})
export class FilesModule {}