import { GatewayIntents } from 'detritus-client-socket/lib/constants';
import { ActivityTypes, PresenceStatuses, CommandRatelimitTypes, ClientEvents } from 'detritus-client/lib/constants';

import { ISRegulationsBot } from './isregs';

const bot = new ISRegulationsBot('', {
  activateOnEdits: true,
  cache: {
    channels: {
      enabled: false
    },
    members: {
      enabled: false
    },
    messages: {
      limit: 1000,
      expire: 60000
    },
    users: {
      enabled: false
    }
  },
  directory: './commands',
  gateway: {
    compress: false,
    identifyProperties: {
      $browser: 'Discord iOS'
    },
    intents: [
      GatewayIntents.GUILD_MESSAGES,
      GatewayIntents.GUILD_MESSAGE_REACTIONS
    ],
    presence: {
      activity: {
        name: 'the regulations',
        type: ActivityTypes.LISTENING
      },
      status: PresenceStatuses.ONLINE
    }
  },
  mentionsEnabled: true,
  ratelimits: [
    {
      duration: 60000,
      limit: 50,
      type: CommandRatelimitTypes.GUILD
    },
    {
      duration: 10000,
      limit: 10,
      type: CommandRatelimitTypes.CHANNEL
    }
  ]
});

bot.on(ClientEvents.COMMAND_RATELIMIT, async ({
  command,
  context,
  global,
  ratelimits
}) => {
  let replied: boolean = false;

  for (const { item, ratelimit, remaining } of ratelimits) {
    if (remaining < 1000 || replied || item.replied) {
      item.replied = true;
      continue;
    }

    replied = item.replied = true;

    let content: string;

    if (global) {
      content = `This ${ratelimit.type} is on cooldown for ${(remaining / 1000).toFixed(1)} seconds.`;
    } else {
      content = `${command.name} is on cooldown in this ${ratelimit.type} for ${(remaining / 1000).toFixed(1)} seconds.`;
    }

    await context.editOrReply(content);
  }
});

bot.on('commandDelete', ({ reply }) => {
  reply.delete();
});

(async () => {
  await bot.run();
})();
