import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coach } from '../common/entities/coach.entity';
import { Court } from '../common/entities/court.entity';
import { Lesson } from '../common/entities/lesson.entity';
import * as bcrypt from 'bcryptjs';
import { User } from '../common/entities/user.entity';

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
    private userRepository: Repository<User>
  ) {}

  async getAvailableTimes(coachName: string, lessonType: string, frequency: number, duration: number) {
    const coach = await this.coachRepository.findOne({ where: { name: coachName } });

    if (!coach) {
      throw new Error('Coach not found');
    }

    const availableTimes = []; // 여기에 가능한 시간대를 계산하여 추가합니다.

    // 7일 내 가능한 시간대 계산 로직 추가

    return availableTimes;
  }

  async bookLesson(
    userName: string,
    userPhone: string,
    coachName: string,
    lessonType: string,
    frequency: number,
    daysAndTimes: string[],
    duration: number,
  ) {
    const user = await this.userRepository.findOne({ where: { name: userName, phoneNumber: userPhone } });
    const coach = await this.coachRepository.findOne({ where: { name: coachName } });

    // 같은 시간대에 다른 레슨이 예약되었는지 확인
    for (const time of daysAndTimes) {
      const existingLesson = await this.lessonRepository.findOne({
        where: { coach, startTime: new Date(time) },
      });
      if (existingLesson) {
        throw new Error('해당 시간대에 이미 예약된 레슨이 있습니다.');
      }
    }

    const newLesson = this.lessonRepository.create({
      lessonType,
      frequencyPerWeek: lessonType === 'recurring' ? frequency : null,
      duration,
      startTime: new Date(daysAndTimes[0]), // 단순히 첫 번째 날짜를 기준으로 합니다.
      user,
      coach,
      isActive: true,
      password: await bcrypt.hash('레슨 패스워드', 10), // 임시 비밀번호
    });

    await this.lessonRepository.save(newLesson);

    return { success: true, data: { id: newLesson.id, password: newLesson.password, lessonStartDateTime: newLesson.startTime } };
  }

  async getLessonInfo(lessonId: number, password: string) {
    const lesson = await this.lessonRepository.findOne({ where: { id: lessonId } });

    if (!lesson || !await bcrypt.compare(password, lesson.password)) {
      throw new Error('레슨 정보가 일치하지 않습니다.');
    }

    return {
      id: lesson.id,
      coachName: lesson.coach.name,
      lessonType: lesson.lessonType,
      frequencyPerWeek: lesson.frequencyPerWeek,
      duration: lesson.duration,
      startTime: lesson.startTime,
      isActive: lesson.isActive,
    };
  }

  async updateLesson(
    lessonId: number,
    password: string,
    updateData: { coachName?: string; frequencyPerWeek?: number; daysAndTimes?: string[]; duration?: number }
  ) {
    const lesson = await this.lessonRepository.findOne({ where: { id: lessonId } });

    if (!lesson || !await bcrypt.compare(password, lesson.password)) {
      throw new Error('레슨 정보가 일치하지 않습니다.');
    }

    if (lesson.lessonType !== 'recurring') {
      throw new Error('정기 레슨만 수정할 수 있습니다.');
    }

    // 업데이트할 내용 적용
    if (updateData.coachName) {
      const coach = await this.coachRepository.findOne({ where: { name: updateData.coachName } });
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
    const lesson = await this.lessonRepository.findOne({ where: { id: lessonId } });

    if (!lesson || !await bcrypt.compare(password, lesson.password)) {
      throw new Error('레슨 정보가 일치하지 않습니다.');
    }

    lesson.isActive = false;
    await this.lessonRepository.save(lesson);
    return { success: true };
  }
}