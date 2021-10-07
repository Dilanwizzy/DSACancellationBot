import { Cluster } from 'puppeteer-cluster3';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import Ua from 'puppeteer-extra-plugin-anonymize-ua';
import UserAgent from 'user-agents';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import { ApiConfigService } from '../shared/services/api-config.service';
import {
  BrowserConnectOptions,
  BrowserLaunchArgumentOptions,
  LaunchOptions,
  Page,
} from 'puppeteer';
import { Log } from '../providers/utils/Log';
import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProxyService } from '../modules/proxy/proxy.service';
import * as helper from './constants/index';
import { ProxyDto } from '../modules/proxy/dto/proxy.dto';
import * as sites from '../sites/index';
import { Captcha } from './captcha';
import { exec } from 'child_process';
import { BookedTimeService } from '../modules/booked-time/booked-time.service';

@Injectable()
export class Clusters {
  private userAgent: UserAgent;
  private readonly log = new Log('ClusterHelper').api();
  private cluster: Cluster;
  private proxy: ProxyDto;
  private count: number = 1;

  constructor(
    private readonly configService: ApiConfigService,
    private readonly proxyService: ProxyService,
    private readonly captcha: Captcha,
    private readonly bookedTimeService: BookedTimeService,
    private eventEmitter: EventEmitter2,
  ) {
    puppeteer.use(StealthPlugin());
    puppeteer.use(Ua());
    puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

    this.userAgent = new UserAgent();
  }

  private async build(): Promise<void> {
    const proxy = helper.createProxyString(this.proxy);

    this.log.info(`Proxy ${proxy}`);

    const puppeteerOptions: LaunchOptions &
      BrowserLaunchArgumentOptions &
      BrowserConnectOptions = {
      headless: false,
      defaultViewport: null,
      slowMo: 5,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-features=AudioServiceOutOfProcess',

        // '--no-sandbox',
        // '--disable-setuid-sandbox',
        // '--disable-web-security',
        // '--disable-features=IsolateOrigins,site-per-process',
        // '--disable-setuid-sandbox',
        // '--disable-dev-shm-usage',
        // '--no-first-run',
        `--user-agent=${this.userAgent.random()}`,
        // '--no-zygote',
      ],
    };

    if (proxy) {
      puppeteerOptions.args.push(`--proxy-server=${proxy}`);
    }

    this.cluster = await Cluster.launch({
      puppeteer,
      concurrency: Cluster.CONCURRENCY_BROWSER,
      maxConcurrency:
        parseInt(this.configService.parallelTasks.toString()) || 1,
      timeout: 25 * 60 * 1000,
      monitor: true,
      puppeteerOptions,
    });
  }

  public async queue(pageUrl: string): Promise<void> {
    this.userAgent = new UserAgent().random();

    this.log.info('In Queue');

    this.proxy = await this.proxyService.getOldestAvailableProxy();

    this.log.info(`proxies ${this.proxy.id}`);

    await this.build();

    await this.cluster.task(async ({ page, data: url }) => {
      this.log.info('Cluster started');

      if (this.proxy) {
        this.log.info('This proxy', this.proxy.id);
        await page.authenticate({
          username: this.proxy.username,
          password: this.proxy.password,
        });
      }
      try {
        const site = new sites['DSA'](
          page,
          url,
          this.configService,
          this.bookedTimeService,
          this.captcha,
        );
        await site.start();
      } catch (err) {
        this.log.error(`Exiting - An error occured ${err}`);
      }

      //Send mail
    });

    this.cluster.queue(pageUrl);

    //DO some cleanup
    await this.cluster.idle();
    await this.cluster.close();
    this.log.info('Closed');
    exec('pkill chrome');
    this.eventEmitter.emit('clusters.stopped');
    this.proxyService.proxyNoLongerBeingUsed(this.proxy.id);
  }
}
