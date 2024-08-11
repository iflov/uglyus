import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Court {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  availableOnWeekends: boolean;
}