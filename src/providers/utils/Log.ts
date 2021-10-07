import { Logger } from 'winston';
import { LoggerFactory } from './Logging.provider';

export class Log {
  constructor(private className: string, private taskId?:number) {}

  public server = (): Logger => {
    return new LoggerFactory(this.className, this.taskId).getLogger('server');
  };

  public api = (): Logger => {
    return new LoggerFactory(this.className, this.taskId).getLogger('API');
  };

  public config = (): Logger => {
    return new LoggerFactory(this.className, this.taskId).getLogger('Config');
  };

  //   public server: Logger = new LoggerFactory(this.className).getLogger('API');
  //   public static api: Logger = LoggerFactory.api;
}
