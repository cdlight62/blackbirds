export default class BlackbirdsActorConfig extends FormApplication {
  static defaultConfiguration = {
    dthAttribute: 'brawn',
    pthAttribute: 'willpower',
    intAttribute: 'perception',
    movAttribute: 'agility',
    isIgnoredPerilLadderValue: [false, false, false],
    //   "avoidStepOne": false,
    //   "avoidStepTwo": false,
    //   "avoidStepThree": false,
    //   "avoidAll": false
    // },
    encumbranceModifier: 0,
    initiativeModifier: 0,
    movementModifier: 0,
    parrySkills: ['Simple Melee', 'Martial Melee', 'Guile', 'Charm', 'Incantation'],
    dodgeSkills: ['Coordination', 'Guile', 'Drive', 'Ride'],
    magickSkills: ['Incantation', 'Folklore'],
    isMagickUser: false,
    permanentChaosRanks: 0,
    permanentOrderRanks: 0,
    dodgeSound: 'systems/blackbirds/assets/sounds/dodge.mp3',
    parrySound: 'systems/blackbirds/assets/sounds/parry.mp3',
    gruntSound: 'systems/blackbirds/assets/sounds/grunt_m.mp3',
    playGruntSound: true,
  };

  static getValue(actorData, key) {
    const value = getProperty(actorData.flags, `blackbirds.actorConfig.${key}`);
    return value ?? this.defaultConfiguration[key];
  }

  static getConfig(actorData) {
    const cfg = {};
    for (let key in this.defaultConfiguration) {
      cfg[key] = this.getValue(actorData, key);
    }
    return cfg;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['blackbirds sheet actor-config'],
      id: 'blackbirds_actor_config',
      template: 'systems/blackbirds/src/templates/app/actor-config.hbs',
      submitOnChange: true,
      submitOnClose: true,
      closeOnSubmit: false,
      width: 500,
      height: 950,
      scrollY: ['form'],
    });
  }

  /** @override */
  get title() {
    return `${this.object.name}: Actor Configuration`;
  }

  /** @override */
  getData() {
    const appData = super.getData();
    appData.flags = BlackbirdsActorConfig.getConfig(this.object);
    appData.parrySkills = appData.flags.parrySkills.join(', ');
    appData.dodgeSkills = appData.flags.dodgeSkills.join(', ');
    appData.magickSkills = appData.flags.magickSkills.join(', ');
    appData.avoidAllPeril = appData.flags.isIgnoredPerilLadderValue.reduce((a, b) => a && b, true);
    return appData;
  }

  /** @override */
  async _updateObject(event, formData) {
    const actor = this.object;
    const updateData = foundry.utils.expandObject(formData).flags;
    if (actor.type === 'character') {
      const sa = actor.system.stats.secondaryAttributes;
      const saPath = 'system.stats.secondaryAttributes';
      const actorUpdate = {};
      updateData.parrySkills = updateData.parrySkills.split(',').map((skill) => skill.trim());
      if (!updateData.parrySkills.includes(sa.parry.associatedSkill)) {
        actorUpdate[`${saPath}.parry.associatedSkill`] = updateData.parrySkills[0] ?? '';
      }
      updateData.dodgeSkills = updateData.dodgeSkills.split(',').map((skill) => skill.trim());
      if (!updateData.dodgeSkills.includes(sa.dodge.associatedSkill)) {
        actorUpdate[`${saPath}.dodge.associatedSkill`] = updateData.dodgeSkills[0] ?? '';
      }
      updateData.magickSkills = updateData.magickSkills.split(',').map((skill) => skill.trim());
      if (!updateData.magickSkills.includes(sa.magick.associatedSkill)) {
        actorUpdate[`${saPath}.magick.associatedSkill`] = updateData.magickSkills[0] ?? '';
      }
      // wtf is this template system haha
      updateData.isIgnoredPerilLadderValue = [
        updateData.isIgnoredPerilLadderValue['[0]'],
        updateData.isIgnoredPerilLadderValue['[1]'],
        updateData.isIgnoredPerilLadderValue['[2]'],
      ];
      const avoidAllUpdate = foundry.utils.expandObject(formData).avoidAllPeril;
      const avoidAllBefore = BlackbirdsActorConfig.getConfig(this.object.data).isIgnoredPerilLadderValue.reduce(
        (a, b) => a && b,
        true
      );
      if (avoidAllUpdate && !avoidAllBefore) {
        updateData.isIgnoredPerilLadderValue = [true, true, true];
      } else if (!avoidAllUpdate && avoidAllBefore) {
        updateData.isIgnoredPerilLadderValue = [false, false, false];
      }
      if (Object.keys(actorUpdate).length) {
        await actor.update(actorUpdate);
      }
    }
    await actor.setFlag('blackbirds', 'actorConfig', updateData);
    this.render();
  }
}
