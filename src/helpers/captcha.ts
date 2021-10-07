import { ApiConfigService } from '../shared/services/api-config.service';
import { Log } from '../providers/utils/Log';
import { Injectable } from '@nestjs/common';
import { Frame, Page } from 'puppeteer';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs/operators';
import rp from 'request-promise';

declare const window: any;
@Injectable()
export class Captcha {
  private readonly log = new Log('Captcha').api();
  public page: Page;

  constructor(
    private readonly configService: ApiConfigService,
    private httpService: HttpService,
  ) {}

  private async submitCaptcha(
    googleKey: string,
    pageUrl: string,
  ): Promise<any> {
    try {
      // const response = this.httpService
      //   .post(
      //     `http://2captcha.com/in.php?key=${this.configService.captchaConfig.apiKey}&method=userrecaptcha&googlekey=${googleKey}&pageurl=${pageUrl}&json=1`,
      //     {},
      //   )
      //   .pipe(map((axiosResponse) => axiosResponse.data));

      // const js = JSON.stringify(response);
      // this.log.info(`submitted captcha returned values ${js}`);
      // const responseJson = JSON.parse(js);
      const option = {
        uri: `http://2captcha.com/in.php?key=${this.configService.captchaConfig.apiKey}&method=userrecaptcha&googlekey=${googleKey}&pageurl=${pageUrl}&json=1`,
        method: 'POST'

      }

      const response = await rp(option);
      const responseJson = JSON.parse(response);

      this.log.info(`submitted captcha returned values ${responseJson.request}`);

      if (responseJson.status) {
        return responseJson;
      }

      throw new Error(responseJson.error_text);
    } catch (error) {
      throw error;
    }
  }

  private async getCaptchaResult(captchaId): Promise<any> {
    try {
      // const response = this.httpService
      //   .get(
      //     `http://2captcha.com/res.php?key=${this.configService.captchaConfig.apiKey}&action=get&id=${captchaId}&json=1`,
      //   )
      //   .pipe(map((axiosResponse) => axiosResponse.data));

      // const js = JSON.stringify(response);

      const options = {
        uri: `http://2captcha.com/res.php?key=${this.configService.captchaConfig.apiKey}&action=get&id=${captchaId}&json=1`,
        method: 'GET'
      }

      const response = await rp(options);
      const responseJson = JSON.parse(response);

      if (responseJson.status) {
        return responseJson;
      }

      throw new Error(responseJson.error_text);
    } catch (error) {
      throw error;
    }
  }

  async solveCaptcha({ captchaSelector, captchaIframeSelector }) {
    const googleKey = '6Ld38BkUAAAAAPATwit3FXvga1PI6iVTb6zgXw62';
    try {
      this.log.info('Detected Captcha Solving');

      let context: any = this.page;

      if (captchaSelector && captchaIframeSelector) {
        const frameHandle = await this.page.$(captchaIframeSelector);
        context = await frameHandle.contentFrame();
      }

      this.log.info(`Extracted googleKey ${googleKey}`);
      this.log.info(`Captcha Url ${context.url()}`);

      const captcha = await this.submitCaptcha(googleKey, context.url());
      const captchaId = captcha.request;

      this.log.info(`Submitted captcha to 2captcha, got id ${captchaId}`);
      

      let solved = false;
      let captchaAnswer;
      while (!solved) {
        try {
          const result = await this.getCaptchaResult(captchaId);
          if (result && result.request) {
            captchaAnswer = result.request;
            solved = true;
          }
        } catch (err) {
          await this.page.waitForTimeout(1000);
        }
      }

      if (captchaAnswer) {
        this.log.info(
          `Got captcha result ${captchaAnswer} from 2captcha, submitting`,
        );
        //script is from https://gist.github.com/2captcha/2ee70fa1130e756e1693a5d4be4d8c70
        await context.evaluate((captchaAnswerText) => {
          function findRecaptchaClients() {
            if (typeof window.___grecaptcha_cfg !== 'undefined') {
              return Object.entries(window.___grecaptcha_cfg.clients).map(
                ([cid, client]) => {
                  const data: any = {
                    id: cid,
                    version: parseInt(cid) >= 10000 ? 'V3' : 'V2',
                  };
                  const objects = Object.entries(client).filter(
                    ([, value]) => value && typeof value === 'object',
                  );

                  objects.forEach(([toplevelKey, toplevel]) => {
                    const found: any = Object.entries(toplevel).find(
                      ([, value]) =>
                        value &&
                        typeof value === 'object' &&
                        'sitekey' in value &&
                        'size' in value,
                    );
                    if (found) {
                      const [sublevelKey, sublevel] = found;

                      data.sitekey = sublevel.sitekey;
                      const callbackKey =
                        data.version === 'V2' ? 'callback' : 'promise-callback';
                      const callback = sublevel[callbackKey];
                      if (!callback) {
                        data.callback = null;
                        data.function = null;
                      } else {
                        data.function = callback;
                        const keys = [
                          cid,
                          toplevelKey,
                          sublevelKey,
                          callbackKey,
                        ]
                          .map((key) => `['${key}']`)
                          .join('');
                        data.callback = `___grecaptcha_cfg.clients${keys}`;
                      }
                    }
                  });
                  return data;
                },
              );
            }
            return [];
          }

          document.querySelector('#g-recaptcha-response').innerHTML =
            captchaAnswerText;
          const recaptchaClients = findRecaptchaClients();
          const defaultRecaptchaClient = recaptchaClients[0];
          let callbackFunction = defaultRecaptchaClient.callback;

          if (typeof callbackFunction === 'function') {
            callbackFunction(captchaAnswerText);
          } else if (typeof callbackFunction === 'string') {
            callbackFunction = eval(callbackFunction);
            if (typeof callbackFunction === 'function') {
              callbackFunction(captchaAnswerText);
            } else if (typeof callbackFunction === 'string') {
              window[callbackFunction](captchaAnswerText);
            }
          }

          return callbackFunction;
        }, captchaAnswer);
      }

      const submissionSucccess = true;
      return submissionSucccess;
    } catch (err) {
      this.log.error(`An error occured when submitting captcha ${err}`);
      throw err;
    }
  }
}
