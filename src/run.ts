import { ClusterManager } from 'detritus-client';

import { token } from '../config.json';
import { getSectionSubsections } from './regs';

const manager = new ClusterManager('./bot', token);

(async () => {
  await manager.run();
  console.log('Online');
})();
