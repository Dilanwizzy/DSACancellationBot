import { Injectable } from '@nestjs/common';
import { Log } from '../../providers/utils/Log';
import { FindConditions, Repository } from 'typeorm';
import { UserRegisterDto } from '../auth/dto/UserRegisterDto';
import { UserDto } from './dto/user.dto';
import { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  private readonly log = new Log('UserService').api();

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Find a single user
   */
  findOne(findDate: FindConditions<UserEntity>): Promise<UserEntity> {
    return this.userRepository.findOne(findDate);
  }
  async findByUsernameOrEmail(
    options: Partial<{ username: string; email: string }>,
  ): Promise<UserEntity> | undefined {
    this.log.debug('Inside findByUsernameOrEmail', options);
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (options.email) {
      this.log.debug('Looking for a user by email');
      queryBuilder.orWhere('user.email = email', {
        email: options.email,
      });
    }

    if (options.username) {
      this.log.debug('Looking for a user by username');
      queryBuilder.orWhere('user.username = username', {
        username: options.username,
      });

      return queryBuilder.getOne();
    }
  }

  async createUser(userRegisterDto: UserRegisterDto): Promise<UserEntity> {
    this.log.debug('Creating new user');
    const user = this.userRepository.create(userRegisterDto);
    this.log.debug('User been created');
    return this.userRepository.save(user);
  }

  async getUser(userId: string): Promise<UserDto> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    queryBuilder.where('user.id = :userId', { userId });

    const userEntity = await queryBuilder.getOne();

    return userEntity.toDto();
  }
}
