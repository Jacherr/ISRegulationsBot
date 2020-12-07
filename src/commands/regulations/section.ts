/* eslint-disable no-eval */
import { Command } from 'detritus-client';

import { BaseCommand } from '../basecommand';
import { getSectionSubsections, formatContent, getRawSection, getSectionContent } from '../../regs';
import { EmbedColors } from '../../constants';

export interface CommandArgs {
  section: string
}

export default class UpdateCommand extends BaseCommand {
  name = 'section'

  label = 'section'

  metadata = {
    description: 'Get all info in a section',
    examples: ['2'],
    usage: '[section]'
  }

  async run (context: Command.Context, args: CommandArgs) {
    const { section } = args;
    if (section.includes('.')) {
      const mainSection = section.split('.')[0];
      if (isNaN(parseInt(mainSection)) || parseInt(mainSection) > 10 || parseInt(mainSection) < 1) {
        return this.error(context, 'Input a valid section!');
      }

      const subSectionNumber = parseInt(section.split('.')[1]);
      const sectionInfo = await getSectionSubsections(parseInt(mainSection));

      const subSection = sectionInfo[subSectionNumber - 1];
      if (!subSection) {
        return this.error(context, `No subsection ${subSectionNumber} exists for section ${mainSection}!`);
      }

      return context.editOrReply({
        embed: {
          title: formatContent(subSection.heading),
          description: formatContent(subSection.content),
          color: EmbedColors.INFO
        }
      });
    } else {
      if (isNaN(parseInt(section)) || parseInt(section) > 10 || parseInt(section) < 1) {
        return this.error(context, 'Input a valid section!');
      }

      const validSection = parseInt(section);

      const sectionInfo = await getSectionSubsections(validSection);

      if (sectionInfo.length > 0) {
        const pages = sectionInfo.map(subsection => {
          return {
            embed: {
              title: formatContent(subsection.heading),
              description: formatContent(subsection.content),
              color: EmbedColors.INFO
            }
          };
        });

        return this.isregs.paginator.createReactionPaginator({
          pages,
          message: context
        });
      } else {
        const sectionContent = await getSectionContent(validSection);
        if (!sectionContent) return this.error(context, 'No section content found..?');
        return context.editOrReply({
          embed: {
            title: formatContent(sectionContent?.heading),
            description: formatContent(sectionContent?.content),
            color: EmbedColors.INFO
          }
        });
      }
    }
  }
}
