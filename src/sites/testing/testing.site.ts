import { Captcha } from '../../helpers/captcha';
import { ElementHandle, Page } from 'puppeteer';
import { Log } from '../../providers/utils/Log';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { BookedTimeService } from '../../modules/booked-time/booked-time.service';

export class Random {
    private log = new Log('Random').api();
    constructor(
        private page: Page,
        private url: string,
        private apiConfigService: ApiConfigService,
        private bookedTimeService: BookedTimeService,
        private captcha: Captcha,
    ) { }


    /**
     * The main start process
     */
    public async start(): Promise<boolean> {

        this.page.goto(this.url, { waitUntil: ['domcontentloaded'] });
        this.log.info('Site loaded');

        this.page.waitForTimeout(20 * 1000);

        return false;
    }
}