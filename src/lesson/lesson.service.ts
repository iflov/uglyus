import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Coach } from '../common/entities/coach.entity';
import { Court } from '../common/entities/court.entity';
import { Lesson } from '../common/entities/lesson.entity';
import * as bcrypt from 'bcryptjs';
import { User } from '../common/entities/user.entity';
import { RequestSearchLessonDto } from './dtos/request.search.lesson.dto';
import dayjs from 'dayjs';
import { RequestPostLessonDto } from './dtos/request.post.lesson.dto';
import { RequestSearchAvailableLessonDto } from './dtos/request.search.available.lesson.dto';



@Injectable()
export class LessonService {
  constructor(
    @InjectRepository(Coach)
    private coachRepository: Repository<Coach>,
    @InjectRepository(Court)
    private courtRepository: Repository<Court>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getAvailableTimes({
    coachName,
    lessonType,
    frequency,
    duration,
  }: RequestSearchLessonDto) {
    const coach = await this.coachRepository.findOne({
      where: { name: coachName },
    });

    if (!coach) {
      throw new Error('Coach not found');
    }

    const startDate = dayjs().add(1, 'day').startOf('day');
    const endDate = startDate.add(7, 'day');

    const availableTimes = [];

    for (
      let date = startDate;
      date.isBefore(endDate);
      date = date.add(1, 'day')
    ) {
      const dayStart = date.hour(7);
      const dayEnd = date.hour(23);

      const existingLessons = await this.lessonRepository.find({
        where: {
          coach: { id: coach.id },
          startTime: Between(dayStart.toDate(), dayEnd.toDate()),
        },
      });

      const maxCourts = date.day() === 0 || date.day() === 6 ? 3 : 5; // 0 is Sunday, 6 is Saturday

      for (let hour = 7; hour < 23; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = date.hour(hour).minute(minute);
          const endTime = time.add(duration, 'minute');

          const conflictingLessons = existingLessons.filter(
            (lesson) =>
              ((dayjs(lesson.startTime).isBefore(time) ||
                dayjs(lesson.startTime).isSame(time)) &&
                dayjs(lesson.endTime).isAfter(time)) ||
              (dayjs(lesson.startTime).isBefore(endTime) &&
                (dayjs(lesson.endTime).isAfter(endTime) ||
                  dayjs(lesson.endTime).isSame(endTime))),
          );

          if (conflictingLessons.length < maxCourts) {
            // 레슨 타입과 주 횟수를 고려한 추가 검증
            if (this.isValidTimeSlot(time, lessonType, frequency)) {
              availableTimes.push(time.format());
            }
          }
        }
      }
    }

    return availableTimes;
  }

  private isValidTimeSlot(
    time: dayjs.Dayjs,
    lessonType: string,
    frequency: number,
  ): boolean {
    if (lessonType === 'one-time') {
      // 1회 레슨의 경우 모든 시간대가 유효
      return true;
    } else if (lessonType === 'recurring') {
      // 정기 레슨의 경우 주 횟수에 따라 유효성 검사
      const dayOfWeek = time.day();
      switch (frequency) {
        case 1:
          // 주 1회: 월요일만 유효
          return dayOfWeek === 1;
        case 2:
          // 주 2회: 월요일과 목요일만 유효
          return dayOfWeek === 1 || dayOfWeek === 4;
        case 3:
          // 주 3회: 월요일, 수요일, 금요일만 유효
          return dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
        default:
          return false;
      }
    }
    return false;
  }

  async bookLesson(bookLessonDto: RequestPostLessonDto) {
    const {
      userName,
      userPhone,
      coachName,
      lessonType,
      frequency,
      daysAndTimes,
      duration,
    } = bookLessonDto;
    const user = await this.userRepository.findOne({
      where: { name: userName, phoneNumber: userPhone },
    });
    const coach = await this.coachRepository.findOne({
      where: { name: coachName },
    });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    if (!coach) {
      throw new Error('코치를 찾을 수 없습니다.');
    }

    // 같은 시간대에 다른 레슨이 예약되었는지 확인
    for (const time of daysAndTimes) {
      const existingLesson = await this.lessonRepository.findOne({
        where: { coach, startTime: new Date(time) },
      });
      if (existingLesson) {
        throw new Error('해당 시간대에 이미 예약된 레슨이 있습니다.');
      }
    }

    const password = this.generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newLesson = this.lessonRepository.create({
      lessonType,
      frequencyPerWeek: lessonType === 'recurring' ? frequency : null,
      duration,
      startTime: new Date(daysAndTimes[0]), // 단순히 첫 번째 날짜를 기준으로 합니다.
      endTime: dayjs(daysAndTimes[0]).add(duration, 'minute').toDate(),
      user,
      coach,
      isActive: true,
      password: hashedPassword,
    });

    await this.lessonRepository.save(newLesson);

    return {
      success: true,
      data: {
        id: newLesson.id,
        password: password, // 평문 비밀번호를 반환합니다.
        lessonStartDateTime: newLesson.startTime,
      },
    };
  }

  private generatePassword(): string {
    // 간단한 비밀번호 생성 로직. 필요에 따라 더 복잡한 로직으로 변경 가능합니다.
    return Math.random().toString(36).slice(-8);
  }

  async getLessonInfo(
    requestSearchAvailableLessonDto: RequestSearchAvailableLessonDto,
  ) {
    const { lessonId, password } = requestSearchAvailableLessonDto;
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
      relations: ['coach', 'user'],
    });

    if (!lesson || !(await bcrypt.compare(password, lesson.password))) {
      throw new NotFoundException('레슨 정보가 일치하지 않습니다.');
    }

    return {
      id: lesson.id,
      coachName: lesson.coach.name,
      lessonType: lesson.lessonType,
      frequencyPerWeek: lesson.frequencyPerWeek,
      duration: lesson.duration,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      isActive: lesson.isActive,
    };
  }

  async updateLesson(
    lessonId: number,
    password: string,
    updateData: {
      coachName?: string;
      frequencyPerWeek?: number;
      daysAndTimes?: string[];
      duration?: number;
    },
  ) {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
    });

    if (!lesson || !(await bcrypt.compare(password, lesson.password))) {
      throw new Error('레슨 정보가 일치하지 않습니다.');
    }

    if (lesson.lessonType !== 'recurring') {
      throw new Error('정기 레슨만 수정할 수 있습니다.');
    }

    // 업데이트할 내용 적용
    if (updateData.coachName) {
      const coach = await this.coachRepository.findOne({
        where: { name: updateData.coachName },
      });
      lesson.coach = coach;
    }
    if (updateData.frequencyPerWeek !== undefined) {
      lesson.frequencyPerWeek = updateData.frequencyPerWeek;
    }
    if (updateData.duration !== undefined) {
      lesson.duration = updateData.duration;
    }
    if (updateData.daysAndTimes) {
      lesson.startTime = new Date(updateData.daysAndTimes[0]);
    }

    await this.lessonRepository.save(lesson);
    return { success: true };
  }

  async cancelLesson(lessonId: number, password: string) {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
    });

    if (!lesson || !(await bcrypt.compare(password, lesson.password))) {
      throw new Error('레슨 정보가 일치하지 않습니다.');
    }

    lesson.isActive = false;
    await this.lessonRepository.save(lesson);
    return { success: true };
  }
}
