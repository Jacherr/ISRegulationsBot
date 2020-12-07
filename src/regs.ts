import fetch from 'node-fetch';

interface Section {
    heading: string
    content: string
}

const REGS_URL = 'https://www.aber.ac.uk/en/is/regulations/itregs/detailedregs/';

const html: string | null = null;

export async function getRawRegulationsHtml () {
  return html || fetch(REGS_URL).then(x => x.text());
}

export async function getHeading () {
  const html = await getRawRegulationsHtml();
  const contentPrimary = html.slice(html.indexOf('<article class="content-primary">'), html.indexOf('</article>'));
  let lines = contentPrimary.split('\n');
  lines = lines.filter(l => !!l);
  const headingRaw = lines.find(line => line.includes('<h1>'));
  if (!headingRaw) return null;
  const heading = headingRaw.slice(headingRaw.indexOf('<h1>') + 4, headingRaw.indexOf('</h1>'));
  return heading;
}

export async function getContentUE () {
  const html = await getRawRegulationsHtml();
  const contentUE = html.slice(html.indexOf('<div class="content ue ">'), html.indexOf('::after'));
  return contentUE;
}

export async function getRawSection (targetSection: number) {
  const c = await getContentUE();
  const sectionStart = await getStartIndexOfSection(targetSection);
  const sectionEnd = await getEndIndexOfSection(targetSection);
  const section = c.slice(sectionStart, sectionEnd);
  return section;
}

export async function getStartIndexOfSection (targetSection: number) {
  const c = await getContentUE();
  let sectionStart: number;
  if (targetSection !== 10) {
    sectionStart = c.indexOf('<h3>' + targetSection + ' ');
  } else {
    sectionStart = c.indexOf('<p><strong>' + targetSection + ' ');
  }
  return sectionStart;
}

export async function getEndIndexOfSection (targetSection: number) {
  const c = await getContentUE();
  let sectionEnd: number;
  if (targetSection !== 10) {
    sectionEnd = c.indexOf('<h3>' + (targetSection + 1) + ' ');
  } else {
    sectionEnd = c.indexOf('<p><em>');
  }
  return sectionEnd;
}

export async function getSectionSubsections (targetSection: number): Promise<Section[]> {
  const output: Section[] = [];
  const s = await getRawSection(targetSection);
  const lines = s.split('\n');
  const sectionStarts = lines.filter(line => line.includes('<strong>' + targetSection + '.'));
  if (sectionStarts.length === 0) return [];
  let i = 0;
  for (const sectionStart of sectionStarts) {
    const startLine = lines.indexOf(sectionStart);
    let endLine;
    if (i !== sectionStarts.length - 1) endLine = lines.indexOf(sectionStarts[i + 1]);
    else endLine = await getEndIndexOfSection(targetSection);
    output.push({
      heading: sectionStart,
      content: lines.slice(startLine + 1, endLine).join('\n')
    });
    i++;
  }

  return output;
}

export async function getSectionContent (targetSection: number): Promise<Section | null> {
  const raw = await getRawSection(targetSection);
  const lines = raw.split('\n');
  return {
    heading: lines[0],
    content: lines.slice(1).join('\n')
  };
}

export function formatContent (content: string) {
  let outputContent = content;
  // @ts-ignore
  outputContent = outputContent.replaceAll('<strong>', '**')
    .replaceAll('</strong>', '**')
    .replaceAll('<p>', '')
    .replaceAll('</p>', '')
    .replaceAll('<li>', '- ')
    .replaceAll('</li>', '')
    .replaceAll('<ul>', '')
    .replaceAll('</ul>', '')
    .replaceAll('&rsquo;', "'")
    .replaceAll('&lsquo;', "'")
    .replaceAll('&nbsp;', '')
    .replaceAll('<h3>', '**')
    .replaceAll('</h3>', '**');

  while (outputContent.indexOf('<a href=') !== -1) {
    const [startIndex, endIndex] = [outputContent.indexOf('<a href='), outputContent.indexOf('</a>')];
    const href = outputContent.slice(startIndex, endIndex);

    const [linkStartIndex, linkEndIndex] = [href.indexOf('"'), href.lastIndexOf('"')];
    const rawLink = href.slice(linkStartIndex + 1, linkEndIndex);
    const link = rawLink.startsWith('/') ? `https://aber.ac.uk${rawLink}` : rawLink;

    const titleStartIndex = href.indexOf('>') + 1;
    const title = href.slice(titleStartIndex);

    outputContent = outputContent.replace(`<a href="${rawLink}">${title}</a>`, `[${title}](${link})`);
    console.log(`<a href="${link}">${title}</a>`);
  }
  return outputContent;
}
