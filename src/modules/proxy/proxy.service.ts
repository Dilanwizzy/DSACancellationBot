import { Injectable } from '@nestjs/common';
import { PageDto } from '../../common/dto/page.dto';
import { FindConditions } from 'typeorm';
import { Log } from '../../providers/utils/Log';
import { NewProxyDto } from './dto/NewProxyDto';
import { ProxiesPageOptions } from './dto/proxies-page-options.dto';
import { ProxyDto } from './dto/proxy.dto';
import { ProxyEntity } from './proxy.entity';
import { ProxyRepository } from './proxy.repository';

@Injectable()
export class ProxyService {
  private readonly log = new Log('ProxyService').api();

  constructor(private readonly proxyRepository: ProxyRepository) {}

  async findOne(
    findDate: FindConditions<ProxyEntity>,
  ): Promise<ProxyEntity> | undefined {
    return this.proxyRepository.findOne(findDate);
  }

  async getProxies(
    pageOptionsDto: ProxiesPageOptions,
  ): Promise<PageDto<ProxyDto>> {
    const queryBuilder = this.proxyRepository.createQueryBuilder('proxy');
    const { items, pageMetaDto } = await queryBuilder.paginate(pageOptionsDto);

    return items.toPageDto(pageMetaDto);
  }

  async getProxiesNotBeingUsed(
    pageOptionsDto: ProxiesPageOptions,
  ): Promise<PageDto<ProxyDto>> {
    const queryBuilder = this.proxyRepository.createQueryBuilder('proxy');
    queryBuilder.where('proxy.hasbeen_used = :hasBeenUsed', {
      hasBeenUsed: false,
    });
    const { items, pageMetaDto } = await queryBuilder.paginate(pageOptionsDto);

    return items.toPageDto(pageMetaDto);
  }

  async getOldestAvailableProxy(): Promise<ProxyDto> | undefined {
    const queryBuilder = this.proxyRepository.createQueryBuilder('proxy');
    queryBuilder.orderBy('proxy.updatedAt', 'ASC');
    queryBuilder.andWhere('proxy.hasbeen_used = :hasBeenUsed', {
      hasBeenUsed: false,
    });

    const proxyEntity = await queryBuilder.getOne();

    if (proxyEntity != undefined) {
      const proxyDto = proxyEntity.toDto<typeof ProxyDto>({
        isActive: true,
      });

      if (proxyDto.hasbeenUsed != undefined || proxyDto.hasbeenUsed != null) {
        proxyDto.hasbeenUsed = true;
        const proxy = this.proxyRepository.create(proxyDto);
        this.proxyRepository.save(proxy);
      }

      return proxyDto;
    }
  }

  async proxyNoLongerBeingUsed(proxyId: string): Promise<void> {
    const queryBuilder = this.proxyRepository.createQueryBuilder('proxy');

    queryBuilder.where('proxy.id = :proxyId', {proxyId: proxyId});

    const proxyEntity = await queryBuilder.getOne();

    if (proxyEntity != undefined) {
      const proxyDto = proxyEntity.toDto<typeof ProxyDto>();
      proxyDto.hasbeenUsed = false;

      this.proxyRepository.save(proxyDto);

    }
  }

  async createProxy(newProxyDto: NewProxyDto): Promise<ProxyEntity> {
    this.log.debug('Adding new proxy');
    const proxy = this.proxyRepository.create(newProxyDto);
    this.log.debug('Saving new Proxy');
    return this.proxyRepository.save(proxy);
  }
}
