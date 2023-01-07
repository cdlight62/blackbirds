import BlackbirdsBaseItem from './base-item';
import { rollTest } from '../../dice';
import { getItemRollConfiguration } from '../../apps/test-config';

export default class BlackbirdsSpell extends BlackbirdsBaseItem {
  async roll(item) {
    const { skillItem, additionalConfiguration } = getItemRollConfiguration(item);

    await rollTest(skillItem, 'spell', additionalConfiguration, {
      showDialog: true,
    });
  }
}
