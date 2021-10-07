import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';

import { BookedTimeEntity } from './booked-time.entity';

@EntityRepository(BookedTimeEntity)
export class BookedTimeRepository extends Repository<BookedTimeEntity> {}
