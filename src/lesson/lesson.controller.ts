import { Body, Controller, Delete, Get, Put, Query } from '@nestjs/common';
import { LessonService } from './lesson.service';

@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Get('available-times')
  async getAvailableTimes(
    @Query('coachName') coachName: string,
    @Query('lessonType') lessonType: string,
    @Query('frequency') frequency: number,
    @Query('duration') duration: number,
  ) {
    const availableTimes = await this.lessonService.getAvailableTimes(coachName, lessonType, frequency, duration);
    return { success: true, data: availableTimes };
  }

  @Get('info')
  async getLessonInfo(
    @Query('lessonId') lessonId: number,
    @Query('password') password: string,
  ) {
    const lessonInfo = await this.lessonService.getLessonInfo(lessonId, password);
    return { success: true, data: lessonInfo };
  }

  @Put('update')
  async updateLesson(
    @Body('lessonId') lessonId: number,
    @Body('password') password: string,
    @Body() updateData: { coachName?: string; frequencyPerWeek?: number; daysAndTimes?: string[]; duration?: number }
  ) {
    await this.lessonService.updateLesson(lessonId, password, updateData);
    return { success: true };
  }

  @Delete('cancel')
  async cancelLesson(
    @Body('lessonId') lessonId: number,
    @Body('password') password: string
  ) {
    await this.lessonService.cancelLesson(lessonId, password);
    return { success: true };
  }
}