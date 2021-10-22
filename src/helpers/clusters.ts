import { Cluster } from 'puppeteer-cluster3';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import Ua from 'puppeteer-extra-plugin-anonymize-ua';
import UserAgent from 'user-agents';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import {
  BrowserConnectOptions,
  BrowserLaunchArgumentOptions,
  LaunchOptions,
  Page,
} from 'puppeteer';
import * as helper from './constants/index';
import { ProxyDto } from '../modules/proxy/dto/proxy.dto';
import * as sites from '../sites/index';
import { Captcha } from './captcha';
import { exec } from 'child_process';
import { Log } from '../providers/utils/Log';
import { ApiConfigService } from '../shared/services/api-config.service';
import { ProxyService } from '../modules/proxy/proxy.service';
import { BookedTimeService } from '../modules/booked-time/booked-time.service';
import { MailService } from '../modules/mail/mail.service';
import { BookedTimeDto } from '../modules/booked-time/dto/booked-time.dto';

export class Clusters {
  private readonly log = new Log('ClusterHelper').api();
  private proxy: ProxyDto;

  constructor(
    private readonly configService: ApiConfigService,
    private readonly proxyDto: ProxyDto,
    private readonly bookedTimeService: BookedTimeService,
    private readonly captcha: Captcha,
    private readonly mailService: MailService,
  ) {
    puppeteer.use(StealthPlugin());
    puppeteer.use(Ua());
  }

  async build(): Promise<Cluster> {
    const proxy = helper.createProxyString(this.proxyDto);

    const userAgent = new UserAgent();

    const puppeteerOptions: LaunchOptions &
      BrowserLaunchArgumentOptions &
      BrowserConnectOptions = {
      headless: false,
      defaultViewport: null,
      product: this.configService.useFirefox ? 'firefox' : 'chrome',
      env: {
        ...process.env,
      },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        `--user-agent=${userAgent}`,
        // '--no-zygote',
      ],
    };

    if(this.configService.useFirefox && this.configService.enableProxy) {
      puppeteerOptions.extraPrefsFirefox = {
        "network.proxy.type": 1,
        "network.proxy.http": `${this.proxyDto.ipAddress}:${this.proxyDto.password}@${this.proxyDto.username}`,
        "network.proxy.http_port": this.proxyDto.port
      }
    }

    if (proxy && !this.configService.useFirefox) {
      puppeteerOptions.args.push(`--proxy-server=${proxy}`);
    }

    const cluster = await Cluster.launch({
      puppeteer,
      concurrency: Cluster.CONCURRENCY_BROWSER,
      maxConcurrency:
        parseInt(this.configService.parallelTasks.toString()) || 1,
      timeout: 28 * 60 * 1000,
      monitor: true,
      puppeteerOptions,
    });

    cluster.task(async ({ page, data: url }) => {
      this.log.info('Cluster started');

      if (this.proxyDto && !this.configService.useFirefox) {
        this.log.info(`Proxy detail ${proxy}`);
        await page.authenticate({
          username: this.proxyDto.username,
          password: this.proxyDto.password,
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

        if (site && this.configService.isEmailEnabled) {
          const bookedTimeDto: BookedTimeDto =
            await this.bookedTimeService.getBookedDate('dilan');

          await this.mailService.sendUserConfirmation(
            bookedTimeDto.location,
            bookedTimeDto.bookedDate,
            this.configService.smtpConfig.email,
          );
        }
      } catch (err) {
        this.log.error(`Exiting - An error occured ${err}`);
      }
    });

    return cluster;
  }
}
