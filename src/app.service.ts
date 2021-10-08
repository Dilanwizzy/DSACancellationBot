import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ApiConfigService } from './shared/services/api-config.service';
import { Clusters } from './helpers/clusters';
// import {Clusters} from './helpers/index';
import { Log } from './providers/utils/Log';
import { BookedTimeService } from './modules/booked-time/booked-time.service';
import { ProxyService } from './modules/proxy/proxy.service';
import { Captcha } from './helpers/captcha';
import { ProxyDto } from './modules/proxy/dto/proxy.dto';
import { MailService } from './modules/mail/mail.service';

@Injectable()
export class AppService {
  private readonly log = new Log('AppService').api();

  private spawnNewClusters: boolean = true;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly bookedTimeService: BookedTimeService,
    private readonly proxyService: ProxyService,
    private readonly captcha: Captcha,
    private readonly mailService: MailService,
    private eventEmitter: EventEmitter2,
  ) {}

  // @Cron('0 */30 6-23 * * *')
  @Cron('0 */1 6-24 * * *')
  async getHello(): Promise<void> {
    this.log.info('scheduler startes');
    if (this.spawnNewClusters) {
      this.spawnNewClusters = false;

      const proxyDto: ProxyDto =
        await this.proxyService.getOldestAvailableProxy();

      const cluster = await new Clusters(
        this.apiConfigService,
        proxyDto,
        this.bookedTimeService,
        this.captcha,
        this.mailService,
      ).build();
      let count = 0;
      while (count < this.apiConfigService.parallelTasks) {
        cluster.queue(
          'https://driverpracticaltest.dvsa.gov.uk/manage?execution=e1s1',
        );
        count++;
      }

      await cluster.idle();
      await cluster.close();
      this.log.info('Closed');

      this.spawnNewClusters = true;
      // exec('pkill chrome');
      this.proxyService.proxyNoLongerBeingUsed(proxyDto.id);
    }
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
