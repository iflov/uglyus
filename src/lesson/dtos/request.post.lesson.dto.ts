import {
  IsString,
  IsNumber,
  IsArray,
  IsIn,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';

export class RequestPostLessonDto {
  @IsString()
  userName: string;

  @IsString()
  userPhone: string;

  @IsString()
  coachName: string;

  @IsString()
  @IsIn(['one-time', 'recurring'])
  lessonType: string;

  @IsNumber()
  @Min(1)
  @Max(3)
  frequency: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  daysAndTimes: string[];

  @IsNumber()
  @IsIn([30, 60])
  duration: number;
}
