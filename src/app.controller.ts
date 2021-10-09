import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { AppService } from './app.service';
import { ApiBearerAuth } from '@nestjs/swagger';
// import puppeteer from 'puppeteer';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @UseGuards(AuthGuard)
  // @ApiBearerAuth()
  // @Get('/')
  // async getHello(): Promise<string> {
  //   await this.appService.test();
  //   return 'Hello world';
  // }

  @Post('/')
  async getHello(): Promise<string> {
    await this.appService.sendEmailForClusterFailure();
    return 'Hello world';
  }
}
