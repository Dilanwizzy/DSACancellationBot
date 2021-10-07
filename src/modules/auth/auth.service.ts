import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception';
import { UserDto } from '../../modules/user/dto/user.dto';
import { UserEntity } from '../../modules/user/user.entity';
import { UtilsProvider } from '../../providers/utils.provider';
import { Log } from '../../providers/utils/Log';
import { UserService } from '../user/user.service';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { TokenPayloadDto } from './dto/TokenPayloadDto';
import { UserLoginDto } from './dto/UserLoginDto';

@Injectable()
export class AuthService {
  private readonly log = new Log('AuthService').api();

  constructor(
    public readonly jwtService: JwtService,
    public readonly configService: ApiConfigService,
    public readonly userService: UserService,
  ) {}

  async createToken(user: UserEntity | UserDto): Promise<TokenPayloadDto> {
    this.log.info(`Creating a new token for user ${user.username}`);
    return new TokenPayloadDto({
      expiresIn: this.configService.authConfig.jwtExpirationTime,
      accessToken: await this.jwtService.signAsync({ id: user.id }),
    });
  }

  async validateUser(userLoginDto: UserLoginDto): Promise<UserEntity> {
    this.log.info(`Validating user for ${userLoginDto.username}`);
    this.log.debug(`Validating user for ${JSON.stringify(userLoginDto)}`);
    const user = await this.userService.findOne({
      username: userLoginDto.username,
    });
    const isPasswordValid = await UtilsProvider.validateHash(
      userLoginDto.password,
      user?.password,
    );
    if (!user || !isPasswordValid) {
      this.log.debug(
        `Password was not valid for user ${JSON.stringify(userLoginDto)}`,
      );
      throw new UserNotFoundException();
    }
    return user;
  }
}
