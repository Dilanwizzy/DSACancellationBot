import { ApiPropertyOptional } from '@nestjs/swagger';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import { BookedTimeEntity } from '../booked-time.entity';

export class BookedTimeDto extends AbstractDto {
  @ApiPropertyOptional()
  bookedDate: Date;

  @ApiPropertyOptional()
  earliestDate: Date;

  @ApiPropertyOptional()
  userId: string;

  @ApiPropertyOptional()
  autoBook: boolean;

  @ApiPropertyOptional()
  bookedPreferredLocation: boolean;
  

  constructor(booked: BookedTimeEntity) {
    super(booked);
    this.autoBook = booked.autoBook;
    this.userId = booked.userId;
    this.bookedDate = booked.bookedDate;
    this.bookedPreferredLocation = booked.bookedPreferredLocation;
    this.earliestDate = booked.earliestDate;
  }
}
