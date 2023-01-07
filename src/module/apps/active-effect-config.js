export default class BlackbirdsActiveEffectConfig extends ActiveEffectConfig {
  static get defaultOptions() {
    const classes = ['blackbirds'];

    return foundry.utils.mergeObject(super.defaultOptions, {
      classes,
    });
  }

  /**@override */
  getData() {
    const data = super.getData();

    console.log('getDATA @ BlackbirdsActiveEffectConfig', data);

    return data;
  }
}
