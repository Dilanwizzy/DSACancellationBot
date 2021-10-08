import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, getConnection } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { Log } from '../../providers/utils/Log';
import { BookedTimeRepository } from './booked-time-repository';
import { BookedTimeEntity } from './booked-time.entity';
import { BookedTimeDto } from './dto/booked-time.dto';
import * as helper from '../../helpers/constants/index';

@Injectable()
export class BookedTimeService {
  private readonly log = new Log('ProxyService').api();

  constructor(
    private readonly bookedTimeRepository: BookedTimeRepository,
    @InjectConnection() private connection: Connection,
  ) {}

  @Transactional()
  async getBookedDateByUser(userId: string, newDate: Date, location: string): Promise<boolean> {
    const queryBuilder = this.bookedTimeRepository.createQueryBuilder('time');
    let pickedDate: Date;

    queryBuilder
      .setLock('pessimistic_write_or_fail')
      .where('time.user_id = :userId', { userId: userId });

    const bookedTimeEntity = await queryBuilder.getOne();

    if (bookedTimeEntity != undefined) {
      let updated = false;
      const bookedTimeDto = bookedTimeEntity.toDto<typeof BookedTimeDto>();
      bookedTimeDto.bookedPreferredLocation =
        !bookedTimeDto.bookedPreferredLocation;

      pickedDate = helper.pickTheBestDate(bookedTimeDto, newDate);

      if(bookedTimeDto.bookedDate != pickedDate) {
          bookedTimeDto.bookedDate = pickedDate;
          bookedTimeDto.bookedPreferredLocation = true;
          bookedTimeDto.location = location;
          updated = true;
      }

      const bookedTime = this.bookedTimeRepository.create(bookedTimeDto);

      this.bookedTimeRepository.save(bookedTime);

      return updated;
    }

    return false;
  }

  async getBookedDate(userId: string): Promise<BookedTimeDto> | undefined {
    const queryBuilder = this.bookedTimeRepository.createQueryBuilder('time');

    queryBuilder.where('time.user_id = :userId', {userId: userId});

    const bookedTimeEntity = await queryBuilder.getOne();

    if (bookedTimeEntity != undefined) {
      const bookedTimeDto = bookedTimeEntity.toDto<typeof BookedTimeDto>();

      return bookedTimeDto;
    }
  }

  @Transactional()
  async createNewBookedTime(
    newBookedTimeDto: BookedTimeDto,
  ): Promise<BookedTimeEntity> {
    this.log.debug('Adding new BookedTime');
    const bookedTime = this.bookedTimeRepository.create(newBookedTimeDto);
    this.log.debug('Saving new BookedTime');
    return this.bookedTimeRepository.save(bookedTime);
  }
}
