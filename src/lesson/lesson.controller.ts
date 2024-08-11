import {
  Body,
  Controller,
  Delete,
  Get,
  Put,
  Query,
  Post,
} from '@nestjs/common';
import { LessonService } from './lesson.service';
import { RequestSearchLessonDto } from './dtos/request.search.lesson.dto';
import { RequestPostLessonDto } from './dtos/request.post.lesson.dto';
import { RequestSearchAvailableLessonDto } from './dtos/request.search.available.lesson.dto';

@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Get('available-times')
  async getAvailableTimes(
    @Query() requestFindLessonDto: RequestSearchLessonDto,
  ) {
    const availableTimes =
      await this.lessonService.getAvailableTimes(requestFindLessonDto);
    return { success: true, data: availableTimes };
  }

  @Post('book')
  async bookLesson(@Body() bookLessonDto: RequestPostLessonDto) {
    return this.lessonService.bookLesson(bookLessonDto);
  }

  @Get('info')
  async getLessonInfo(
    @Query() getLessonInfoDto: RequestSearchAvailableLessonDto,
  ) {
    const lessonInfo = await this.lessonService.getLessonInfo(getLessonInfoDto);
    return { success: true, data: lessonInfo };
  }

  @Put('update')
  async updateLesson(
    @Body('lessonId') lessonId: number,
    @Body('password') password: string,
    @Body()
    updateData: {
      coachName?: string;
      frequencyPerWeek?: number;
      daysAndTimes?: string[];
      duration?: number;
    },
  ) {
    await this.lessonService.updateLesson(lessonId, password, updateData);
    return { success: true };
  }

  @Delete('cancel')
  async cancelLesson(
    @Body('lessonId') lessonId: number,
    @Body('password') password: string,
  ) {
    await this.lessonService.cancelLesson(lessonId, password);
    return { success: true };
  }
}
