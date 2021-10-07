import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PageDto } from '../../common/dto/page.dto';
import { Log } from '../../providers/utils/Log';
import { NewProxyDto } from './dto/NewProxyDto';
import { ProxiesPageOptions } from './dto/proxies-page-options.dto';
import { ProxyDto } from './dto/proxy.dto';
import { ProxyService } from './proxy.service';

@Controller('proxy')
@ApiTags('proxy')
export class ProxyController {
  private readonly log = new Log('ProxyController').api();

  constructor(private readonly proxyService: ProxyService) {}

  @Post('new')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: ProxyDto,
    description: 'Created proxy',
  })
  async newProxy(@Body() newProxyDto: NewProxyDto): Promise<ProxyDto> {
    this.log.info('Creating new proxy');
    const createdProxy = await this.proxyService.createProxy(newProxyDto);

    return createdProxy.toDto<typeof ProxyDto>({
      isActive: false,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get users list',
    type: PageDto,
  })
  async getProxies(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: ProxiesPageOptions,
  ): Promise<PageDto<ProxyDto>> {
    this.log.info('getting proxies');
    return this.proxyService.getProxies(pageOptionsDto);
  }

  @Get("available")
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get Proxies list',
    type: PageDto,
  })
  async getProxiesNotBeingUsed(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: ProxiesPageOptions,
  ): Promise<PageDto<ProxyDto>> {
    this.log.info('getting proxies');
    return this.proxyService.getProxiesNotBeingUsed(pageOptionsDto);
  }

  @Get("free")
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get users list',
    type: ProxyDto,
  })
  async getOldestProxy(): Promise<ProxyDto> {
    return await this.proxyService.getOldestAvailableProxy();
  }
}
