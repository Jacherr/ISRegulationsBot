import { CommandClient, CommandClientOptions, CommandClientRunOptions, ClusterClient } from 'detritus-client';

import { PaginatorCluster } from 'detritus-pagination';

import { prefix } from '../config.json';

export interface AssystOptions extends CommandClientOptions {
  directory: string
}

export class ISRegulationsBot extends CommandClient {
  public client!: ClusterClient
  public directory: string
  public paginator: PaginatorCluster

  constructor (token: string, options: AssystOptions) {
    super(token, options);

    this.directory = options.directory;

    this.paginator = new PaginatorCluster(this.client, {
      maxTime: 60000,
      pageNumber: true
    });
  }

  async resetCommands () {
    this.clear();
    await this.addMultipleIn(this.directory, {
      subdirectories: true
    });
  }

  async run (options?: CommandClientRunOptions) {
    await this.resetCommands();
    return super.run(options);
  }

  onPrefixCheck () {
    return prefix;
  }
}
