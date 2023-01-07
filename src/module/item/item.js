import BlackbirdsWeapon from './entity/weapon';
import BlackbirdsProfession from './entity/profession';
import BlackbirdsSkill from './entity/skill';
import BlackbirdsAncestry from './entity/ancestry';
import BlackbirdsArmor from './entity/armor';
import BlackbirdsQuality from './entity/quality';
import BlackbirdsInjury from './entity/injury';
import BlackbirdsSpell from './entity/spell';

import { ZWEI } from '../config';
import BlackbirdsTrapping from './entity/trapping';

export default class BlackbirdsItem extends Item {
  static types = {
    weapon: new BlackbirdsWeapon(),
    armor: new BlackbirdsArmor(),
    profession: new BlackbirdsProfession(),
    skill: new BlackbirdsSkill(),
    ancestry: new BlackbirdsAncestry(),
    injury: new BlackbirdsInjury(),
    quality: new BlackbirdsQuality(),
    trapping: new BlackbirdsTrapping(),
    spell: new BlackbirdsSpell(),
  };

  constructor(...args) {
    super(...args);
  }

  // convention: dispatch is async when the function it calls is
  dispatch(fnName, cfg = { orElse: { value: {}, async: false }, args: [] }) {
    // console.log(`${this.name}: dispatch: ${fnName}`);
    if (BlackbirdsItem.types[this.type]) {
      const type = BlackbirdsItem.types[this.type];
      if (type[fnName] && typeof type[fnName] === 'function') {
        if (cfg.args?.length) {
          return type[fnName](...cfg.args, this);
        } else {
          return type[fnName](this, this);
        }
      }
    }
    if (cfg?.orElse?.async) {
      return Promise.resolve(cfg?.orElse?.value);
    } else {
      return cfg?.orElse?.value;
    }
  }

  prepareData() {
    super.prepareData();
  }

  prepareBaseData() {
    super.prepareBaseData();
    this.dispatch('prepareBaseData');
  }

  prepareEmbeddedDocuments() {
    if (super.prepareEmbeddedDocuments) super.prepareEmbeddedDocuments();
    this.dispatch('prepareEmbeddedEntities');
  }

  prepareEmbeddedEntities() {
    if (super.prepareEmbeddedEntities) super.prepareEmbeddedEntities();
    this.dispatch('prepareEmbeddedEntities');
  }

  applyActiveEffects() {
    super.applyActiveEffects();
    this.dispatch('applyActiveEffects');
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    this.dispatch('prepareDerivedData');
  }

  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    if (!this.img || ZWEI.replacedDefaultCoreIcons.includes(this.img)) {
      const img = ZWEI.defaultItemIcons[this.type] ?? ZWEI.defaultItemIcons._default;
      await this.updateSource({ img });
    }
    if (this.parent === null) return;
    await this.dispatch('_preCreate', { args: [data, options, user] });
  }

  async _onCreate(data, options, user) {
    await super._onCreate(data, options, user);
    // TODO: user is an incorrect parameter and will be fixed in future versions
    if (user !== game.user.id) return;
    await this.dispatch('_onCreate', { args: [data, options, user] });
  }

  async _preDelete(options, user) {
    await super._preDelete(options, user);
    if (this.parent === null) return;
    await this.dispatch('_preDelete', { args: [options, user] });
  }

  async _onDelete(options, user) {
    await super._preDelete(options, user);
    if (user !== game.user.id) return;
    if (this.parent === null) return;
    await this.dispatch('_onDelete', { args: [options, user] });
  }

  async _preUpdate(changed, options, user) {
    if (this.parent && changed.system) {
      await this.dispatch('_preUpdate', { args: [changed, options, user] });
    }
    await super._preUpdate(changed, options, user);
  }

  async _onUpdate(changed, options, user) {
    await super._onUpdate(changed, options, user);
    if (user !== game.user.id) return;
    if (this.parent === null || !changed.system) return;
    await this.dispatch('_onUpdate', { args: [changed, options, user] });
  }

  async roll() {
    await this.dispatch('roll', { args: [this] });
  }
}
