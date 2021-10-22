import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Log } from '../../providers/utils/Log';
import { UserSubscriber } from '../../entity-subscriber/user-subscriber';
import { SnakeNamingStrategy } from '../../snake-naming.strategy';
import path from 'path';

@Injectable()
export class ApiConfigService {
  private readonly log = new Log('ApiConfigService').api();

  constructor(private configService: ConfigService) { }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  private getNumber(key: string, defaultValue?: number): number {
    const value = this.configService.get(key, defaultValue);
    if (value === undefined) {
      throw new Error(key + ' env var not set'); // probably we should call process.exit() too to avoid locking the service
    }
    try {
      return Number(value);
    } catch {
      throw new Error(key + ' env var is not a number');
    }
  }

  private getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.configService.get(key, defaultValue?.toString());
    if (value === undefined) {
      throw new Error(key + ' env var not set');
    }
    try {
      return Boolean(JSON.parse(value));
    } catch {
      throw new Error(key + ' env var is not a boolean');
    }
  }

  private getString(key: string, defaultValue?: string): string {
    const value = this.configService.get(key, defaultValue);

    if (!value) {
      this.log.warn(`"${key}" environment variable is not set`);
      return;
    }
    return value.toString().replace(/\\n/g, '\n');
  }

  get nodeEnv(): string {
    return this.getString('NODE_ENV', 'development');
  }

  get typeOrmConfig(): TypeOrmModuleOptions {
    let entities = [__dirname + '/../../modules/**/*.entity{.ts,.js}'];
    let migrations = [__dirname + '/../../migrations/*{.ts,.js}'];

    if (module.hot) {
      const entityContext = require.context(
        './../../modules',
        true,
        /\.entity\.ts$/,
      );
      entities = entityContext.keys().map((id) => {
        const entityModule = entityContext(id);
        const [entity] = Object.values(entityModule);
        return entity as string;
      });
      const migrationContext = require.context(
        './../../migrations',
        false,
        /\.ts$/,
      );

      migrations = migrationContext.keys().map((id) => {
        const migrationModule = migrationContext(id);
        const [migration] = Object.values(migrationModule);
        return migration as string;
      });
    }
    return {
      entities,
      migrations,
      keepConnectionAlive: true,
      type: 'postgres',
      host: this.getString('POSTGRES_HOST'),
      port: this.getNumber('POSTGRES_PORT'),
      username: this.getString('POSTGRES_USER'),
      password: this.getString('POSTGRES_PASSWORD'),
      database: this.getString('POSTGRES_USER'),
      subscribers: [UserSubscriber],
      migrationsRun: true,
      logging: this.getBoolean('ENABLE_ORMLOGS', this.isDevelopment),
      namingStrategy: new SnakeNamingStrategy(),
    };
  }

  get mailConfig(): MailerOptions {
    return {
      transport: {
        host: this.smtpConfig.host,
        secure: this.smtpConfig.secure,
        port: this.smtpConfig.port,
        auth: {
          user: this.smtpConfig.username,
          pass: this.smtpConfig.password,
        },
      },
      defaults: {
        from: '"No Reply" <noreply@digitalplug.co.uk>',
      },
      template: {
        dir: path.resolve(process.cwd(), 'templates'),
        adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
        options: {
          strict: true,
        },
      },
    };
  }

  get documentationEnabled(): boolean {
    return this.getBoolean('ENABLE_DOCUMENTATION', this.isDevelopment);
  }

  get authConfig() {
    return {
      jwtSecret: this.getString('JWT_SECRET_KEY'),
      jwtExpirationTime: this.getNumber('JWT_EXPIRATION_TIME'),
    };
  }

  get captchaConfig() {
    return {
      apiKey: this.getString('CAPTCHA_API_KEY'),
    };
  }

  get smtpConfig() {
    return {
      host: this.getString('SMTP_HOST'),
      port: this.getNumber('SMTP_PORT'),
      username: this.getString('SMTP_USERNAME'),
      password: this.getString('SMTP_PASSWORD'),
      secure: this.getBoolean('SMTP_SECURE'),
      email: this.getString('EMAIL'),
    };
  }

  get isEmailEnabled() {
    return this.getString('ENABLE_EMAIL');
  }

  get getLicense() {
    return {
      licenseNumber: this.getString('LICENSE_NUMBER'),
      referenceNumber: this.getString('REFERENCE_NUMBER'),
    };
  }

  get parallelTasks(): Number {
    return this.getNumber('PARALLEL_TASKS');
  }

  get appConfig() {
    return {
      port: this.getString('PORT'),
    };
  }

  get useFirefox() {
    return this.getBoolean("PUPPETEER_USE_FIREFOX");
  }

  get enableProxy() {
    return this.getBoolean("ENABLE_PROXY");
  }
}
