import { Repository } from 'typeorm';
import { EntityRepository } from 'typeorm/decorator/EntityRepository';

import { ProxyEntity } from './proxy.entity';

@EntityRepository(ProxyEntity)
export class ProxyRepository extends Repository<ProxyEntity> {}
