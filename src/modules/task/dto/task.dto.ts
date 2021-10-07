import { ApiPropertyOptional } from '@nestjs/swagger';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import { TaskEntity } from '../task.entity';

export class TaskDto extends AbstractDto {
  @ApiPropertyOptional()
  firstName: string;

  @ApiPropertyOptional()
  lastName: string;

  @ApiPropertyOptional()
  username: string;

  @ApiPropertyOptional()
  email: string;

  @ApiPropertyOptional()
  isActive: boolean;

  constructor(task: TaskEntity, options?: Partial<{ isActive: boolean }>) {
    super(task);
    // this.firstName = user.firstName;
    // this.lastName = user.lastName;
    // this.username = user.username;
    // this.email = user.email;
    // this.isActive = options?.isActive;
  }
}
