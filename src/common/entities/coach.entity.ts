import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Coach {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}