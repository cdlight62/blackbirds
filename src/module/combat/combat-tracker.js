export default class BlackbirdsCombatTracker extends CombatTracker {
  get template() {
    return 'systems/blackbirds/src/templates/combat/combat-tracker.hbs';
  }

  activateListeners(html) {
    super.activateListeners(html);
  }
}
