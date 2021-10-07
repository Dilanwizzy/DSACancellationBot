import { Column, Entity, PrimaryColumn } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity';
import { TaskDto } from './dto/task.dto';

@Entity({ name: 'tasks' })
export class TaskEntity extends AbstractEntity<TaskDto> {

  @Column({ nullable: true})
  instances: string;

  @Column({ nullable: true })
  product: string;

  @Column({ unique: true, nullable: false})
  website: string;

  @Column({ unique: true, nullable: false})
  size: string;

  @Column({  nullable: false })
  quantity: string;

  

  dtoClass = TaskDto;
}
