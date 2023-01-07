import BlackbirdsBaseItem from './base-item';
import * as BlackbirdsUtils from '../../utils';

export default class BlackbirdsQuality extends BlackbirdsBaseItem {
  static async getQualities(names) {
    return await Promise.all(
      names.split(',').map(async (q) => {
        const name = q.trim();
        const item = await BlackbirdsUtils.findItemWorldWide('quality', name);
        return {
          name,
          found: item !== undefined,
          effect: BlackbirdsUtils.localize(item?.system?.rules?.effect),
        };
      })
    );
  }

  static async openQuality(name) {
    const item = await BlackbirdsUtils.findItemWorldWide('quality', name);
    return item.sheet.render(true);
  }
}
