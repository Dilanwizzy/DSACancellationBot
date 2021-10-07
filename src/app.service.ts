import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { ApiConfigService } from './shared/services/api-config.service';
import { Clusters } from './helpers/cluster';
import { ClusterP } from './helpers/clusters-p';
// import {Clusters} from './helpers/index';
import { Log } from './providers/utils/Log';
import { BookedTimeService } from './modules/booked-time/booked-time.service';
import { ProxyService } from './modules/proxy/proxy.service';
import { Captcha } from './helpers/captcha';
import { ProxyDto } from './modules/proxy/dto/proxy.dto';

@Injectable()
export class AppService {
  private readonly log = new Log('AppService').api();

  private spawnNewClusters: boolean = true;

  constructor(
    private readonly cluster: Clusters,
    private readonly apiConfigService: ApiConfigService,
    private readonly bookedTimeService: BookedTimeService,
    private readonly proxyService: ProxyService,
    private readonly captcha: Captcha,
  ) {}

  // @Cron('0 */30 6-23 * * *')
  @Cron('* */1 6-23 * * *')
  async getHello(): Promise<void> {
    if (this.spawnNewClusters) {
      this.spawnNewClusters = false;

      const proxyDto: ProxyDto =
        await this.proxyService.getOldestAvailableProxy();

      const cluster = await new ClusterP(
        this.apiConfigService,
        proxyDto,
        this.bookedTimeService,
        this.captcha,
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
