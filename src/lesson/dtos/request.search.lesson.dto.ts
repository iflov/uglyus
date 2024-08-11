import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class RequestSearchLessonDto {
  @IsOptional()
  @IsString()
  coachName?: string;

  @IsOptional()
  @IsString()
  lessonType?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  frequency?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(180)
  duration?: number;
}
