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
import path from 'path';

interface ClusterCheck {
  isClusterFailing: boolean;
  clusterFailCount: number;
  clusterStartedTime: Date;
}

@Injectable()
export class AppService {
  private readonly log = new Log('AppService').api();

  private spawnNewClusters: boolean = true;
  private clusterCheck: ClusterCheck = {
    isClusterFailing: false,
    clusterFailCount: 0,
    clusterStartedTime: new Date(),
  };

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly bookedTimeService: BookedTimeService,
    private readonly proxyService: ProxyService,
    private readonly captcha: Captcha,
    private readonly mailService: MailService,
    private eventEmitter: EventEmitter2,
  ) { }

  // @Cron('0 */30 6-23 * * *')
  @Cron('*/10 * 5-22 * * *')
  async getHello(): Promise<void> {
    if (this.spawnNewClusters && !this.clusterCheck.isClusterFailing) {
      this.spawnNewClusters = false;
      this.clusterCheck.clusterStartedTime = new Date();
      let proxyDto: ProxyDto = null;

      if (this.apiConfigService.enableProxy) {
        proxyDto = await this.proxyService.getOldestAvailableProxy();
      }


      // this.log.info(`Dilan chosen proxy ${proxyDto.id}`);

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
          'https://driverpracticaltest.dvsa.gov.uk/login',
        );
        count++;
      }

      await cluster.idle();
      await cluster.close();
      this.log.info('Closed');

      this.spawnNewClusters = true;
      this.eventEmitter.emit('cluster_closed');
      this.apiConfigService.enableProxy ? this.proxyService.proxyNoLongerBeingUsed(proxyDto.id) : undefined;
    }
  }

  @OnEvent('cluster_closed')
  private async isClusterFailing(): Promise<void> {
    const clusterCloseDate = new Date();

    const timeDiff =
      (clusterCloseDate.getTime() -
        this.clusterCheck.clusterStartedTime.getTime()) /
      60000;
    if (timeDiff <= 5) {
      this.clusterCheck.clusterFailCount++;
    } else {
      this.clusterCheck.clusterFailCount--;
    }

    if (this.clusterCheck.clusterFailCount > 2) {
      this.clusterCheck.isClusterFailing = true;
      //Currently just stopping the application
      //In this case we will need to send an email out;
      await this.sendEmailForClusterFailure();
    }
  }

  public async sendEmailForClusterFailure(): Promise<void> {
    if (this.apiConfigService.isEmailEnabled) {
      await this.mailService.sendClusterFailed(
        this.clusterCheck.clusterStartedTime,
        this.apiConfigService.smtpConfig.email,
      );
    }

    this.log.info('Stopped Spawning new Clusters - As they are failing.');
    this.log.info('Please read the README to section Cluster Spawning');
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
