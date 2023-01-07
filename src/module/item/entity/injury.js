import BlackbirdsBaseItem from './base-item';

export default class BlackbirdsInjury extends BlackbirdsBaseItem {
  async _preCreate(item, options, user, that) {
    await super._preCreate(item, options, user);

    if (that.actor && item?.system?.recuperationTime === 0) {
      const d = Number(item.system.severity) + 1;
      const roll = await new Roll(`${d}d10+${d}`).evaluate();
      const speaker = ChatMessage.getSpeaker({ actor: that.actor });
      roll.toMessage({ flavor: 'Determining Recuperation Time', speaker });
      that.updateSource({ 'system.recuperationTime': roll.total });
    }
  }
}
