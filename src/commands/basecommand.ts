import { Message } from 'detritus-client/lib/structures';
import { Command, CommandClient } from 'detritus-client';
import { Response } from 'detritus-rest';

import { EmbedColors } from '../constants';
import { Context } from 'detritus-client/lib/command';
import { ISRegulationsBot } from '../isregs';

export interface CommandMetadata {
  description?: string,
  examples?: string[],
  usage?: string
}

export class BaseCommand extends Command.Command {
  metadata!: CommandMetadata;

  responseOptional = true;

  constructor (commandClient: CommandClient, options: Partial<Command.CommandOptions>) {
    super(commandClient, Object.assign({
      name: '',
      ratelimits: [
        { duration: 5000, limit: 5, type: 'guild' },
        { duration: 1000, limit: 1, type: 'channel' }
      ]
    }, options));
  }

  get isregs () {
    return this.commandClient as ISRegulationsBot;
  }

  async error (context: Command.Context, content: string) {
    return context.editOrReply({
      embed: {
        color: EmbedColors.ERROR,
        title: '⚠️ Command Error',
        description: content.slice(0, 1500)
      }
    });
  }

  async userOwnsGuild (context: Context) {
    const guild = await context.rest.fetchGuild(context.guildId as string);

    return guild.ownerId === context.userId ||
          context.client.owners.map(u => u.id).includes(context.userId);
  }

  parseMentionOrId (input: string) {
    const match = input.match(/^<@!?(\d{17,19})>/);
    if (match) {
      return match[1];
    } else {
      return input;
    }
  }

  async onBefore (context: Command.Context): Promise<boolean> {
    const oldEditOrReply: ((options: Command.EditOrReply | string) => Promise<Message>) = context.editOrReply.bind(context);

    context.editOrReply = (options?: string | Command.EditOrReply) => {
      if (typeof options === 'string') {
        return oldEditOrReply({
          content: options,
          allowedMentions: {
            parse: []
          }
        });
      } else {
        return oldEditOrReply({
          ...options,
          allowedMentions: {
            parse: []
          }
        });
      }
    };

    return true;
  }

  async onRunError (context: Command.Context, _: any, error: any) {
    const description: string[] = [error.message || error.stack];

    if (error.response) {
      const response: Response = error.response;
      try {
        const information = await response.json() as any;
        if ('errors' in information) {
          for (const key in information.errors) {
            const value = information.errors[key];
            let message: string;
            if (typeof (value) === 'object') {
              message = JSON.stringify(value);
            } else {
              message = String(value);
            }
            description.push(`**${key}**: ${message}`);
          }
        }
      } catch (e) {
        description.push(await response.text());
      }
    }

    await this.error(context, description.join('\n').slice(0, 1500));
  }

  onTypeError (context: Command.Context, args: any, errors: Command.ParsedErrors) {
    const store: { [key: string]: string } = {};

    const description: Array<string> = ['Invalid Arguments' + '\n'];
    for (const key in errors) {
      const message = errors[key].message;
      if (message in store) {
        description.push(`**${key}**: Same error as **${store[message]}**`);
      } else {
        description.push(`**${key}**: ${message}`);
      }
      store[message] = key;
    }

    return context.editOrReply({
      embed: {
        color: EmbedColors.ERROR,
        description: description.join('\n').slice(0, 1500),
        title: '⚠️ Command Argument Error'
      }
    });
  }
}
