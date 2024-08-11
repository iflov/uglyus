import { IsNumber, IsString } from 'class-validator';

export class RequestSearchAvailableLessonDto {
  @IsNumber()
  lessonId: number;

  @IsString()
  password: string;
}
