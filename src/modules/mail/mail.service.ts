import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(location: string, date: Date, email: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Booked time',
      template: './notification', // `.hbs` extension is appended automatically
      context: {
        date: date,
        location: location,
      },
    });
  }

  async sendClusterFailed(date: Date, email: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Cluster Failing',
      template: './cluster-failed', // `.hbs` extension is appended automatically
      context: {
        date: date,
      },
    });
  }
}
