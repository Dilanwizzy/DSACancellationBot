import { Column, Entity, PrimaryColumn } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity';
import { UserDto } from './dto/user.dto';

@Entity({ name: 'users' })
export class UserEntity extends AbstractEntity<UserDto> {

  @Column({ nullable: true})
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true, nullable: false})
  username: string;

  @Column({ unique: true, nullable: false})
  email: string;

  @Column({  nullable: false })
  password: string;

  dtoClass = UserDto;
}
