import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ApiConfigService } from '../shared/services/api-config.service';
import { ProxyModule } from '../modules/proxy/proxy.module';
import { SharedModule } from '../shared/shared.module';
import { Clusters } from './cluster';
import { Captcha } from './captcha';
import { BookedTimeModule } from '../modules/booked-time/booked-time.module';

const providers = [
    Clusters,
    Captcha
]

@Module({
    providers,
    imports: [HttpModule, SharedModule, ProxyModule, BookedTimeModule],
    exports: [...providers, HttpModule]
})
export class HelperModule {}