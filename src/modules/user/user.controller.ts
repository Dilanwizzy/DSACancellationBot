import { Controller } from '@nestjs/common';
import { Log } from '../../providers/utils/Log';

@Controller('user')
export class UserController {
  private readonly log = new Log('UserController').api();
}
