import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Trim } from '../../../decorators/transforms.decorator';

export class NewProxyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Trim()
  readonly ipAddress: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Trim()
  readonly port: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Trim()
  readonly username: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  readonly password: string;
}
