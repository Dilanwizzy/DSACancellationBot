import { ApiPropertyOptional } from '@nestjs/swagger';

import { AbstractDto } from '../../../common/dto/abstract.dto';
import { ProxyEntity } from '../proxy.entity';

export class ProxyDto extends AbstractDto {
  @ApiPropertyOptional()
  ipAddress: string;

  @ApiPropertyOptional()
  port: string;

  @ApiPropertyOptional()
  protocol: string;

  @ApiPropertyOptional()
  username: string;

  @ApiPropertyOptional()
  password: string;

  @ApiPropertyOptional()
  isActive: boolean;

  @ApiPropertyOptional()
  hasbeenUsed: boolean;

  constructor(proxy: ProxyEntity, options?: Partial<{ isActive: boolean }>) {
    super(proxy);
    this.ipAddress = proxy.ipAddress;
    this.port = proxy.port;
    this.protocol = proxy.protocol;
    this.username = proxy.username;
    this.password = proxy.password;
    this.hasbeenUsed = proxy.hasbeenUsed;
    this.isActive = options?.isActive;
  }
}
