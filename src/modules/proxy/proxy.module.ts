import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProxyController } from './proxy.controller';
import { ProxyRepository } from './proxy.repository';
import { ProxyService } from './proxy.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProxyRepository])],
  controllers: [ProxyController],
  providers: [ProxyService],
  exports: [ProxyService]
})
export class ProxyModule {}
