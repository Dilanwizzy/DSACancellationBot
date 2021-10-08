import { Column, Entity, PrimaryColumn } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity';
import { BookedTimeDto } from './dto/booked-time.dto';

@Entity({ name: 'bookedTime' })
export class BookedTimeEntity extends AbstractEntity<BookedTimeDto> {

  @Column({ nullable: false})
  bookedDate: Date;

  @Column({ nullable: false})
  earliestDate: Date;

  @Column()
  userId: string;

  @Column({ default: true})
  autoBook: boolean;

  @Column({nullable: false, default:'NEED_LOCATION'})
  location: string;

  @Column({ default: true})
  bookedPreferredLocation: boolean;

  dtoClass = BookedTimeDto;
}
