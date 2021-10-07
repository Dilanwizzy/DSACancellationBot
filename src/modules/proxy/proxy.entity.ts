import { Column, Entity, PrimaryColumn } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity';
import { ProxyDto } from './dto/proxy.dto';

@Entity({ name: 'proxies' })
export class ProxyEntity extends AbstractEntity<ProxyDto> {

  @Column({ nullable: false, unique: true})
  ipAddress: string;

  @Column()
  port: string;

  @Column({ default: "HTTPS"})
  protocol: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column({ default: false })
  hasbeenUsed: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  dtoClass = ProxyDto;
}
