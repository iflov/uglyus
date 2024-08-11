import { Module } from '@nestjs/common';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { User } from '../common/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coach } from '../common/entities/coach.entity';
import { Court } from '../common/entities/court.entity';
import { Lesson } from '../common/entities/lesson.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coach, Court, Lesson, User]),
  ],
  controllers: [LessonController],
  providers: [LessonService]
})
export class LessonModule {}
