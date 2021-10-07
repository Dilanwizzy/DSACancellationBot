import path from 'path';
import winston, { createLogger, format, Logger, transports } from 'winston';

export class LoggerFactory {
  constructor(private className: string, private taskId?: number) {
    this.className = className;
  }
  public getLogger = (label: string) => {
    return createLogger({
      format: format.combine(
        format.colorize({
          all: true,
          colors: { info: 'green', debug: 'blue', error: 'red' },
        }),
        format.splat(),
        format.ms(),
        format.simple(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        format.printf(({ timestamp, level, message, ms }) => {
          return `[${level}]${this.taskId ? ' - ['+this.taskId + '] ': ' '}${timestamp} - [${this.className}] ${message} ${ms}`;
        }),
      ),
      transports: [
        new transports.Console({
          level: process.env.NODE_ENV == 'production' ? 'info' : 'debug',
          handleExceptions: true,
        }),
        new transports.File({
          format: format.uncolorize(),
          filename: path.join('logs', `/taskId${this.taskId ? '-'+this.taskId : ''}.log`),
        }),
      ],
      exitOnError: false,
    });
  };
}
