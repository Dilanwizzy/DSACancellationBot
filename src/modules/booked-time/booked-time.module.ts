import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookedTimeRepository } from './booked-time-repository';
import { BookedTimeController } from './booked-time.controller';
import { BookedTimeService } from './booked-time.service';

@Module({
  imports: [TypeOrmModule.forFeature([BookedTimeRepository])],
  controllers: [BookedTimeController],
  providers: [BookedTimeService],
  exports: [BookedTimeService]
})
export class BookedTimeModule {}
