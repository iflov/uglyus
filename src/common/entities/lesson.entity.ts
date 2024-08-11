import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Coach } from './coach.entity';
import { Court } from './court.entity';

@Entity()
export class Lesson {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  lessonType: string;

  @Column({ nullable: true })
  frequencyPerWeek?: number;

  @Column()
  duration: number;

  @Column('timestamp')
  startTime: Date;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Coach)
  coach: Coach;

  @ManyToOne(() => Court)
  court: Court;

  @Column()
  endTime: Date;

  @Column()
  password: string;

  @Column()
  isActive: boolean;
}
