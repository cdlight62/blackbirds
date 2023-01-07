import { sendAnalytics } from './analytics';
import * as BlackbirdsDice from './dice';
import * as BlackbirdsUtils from './utils';

export function addGlobalChatListeners(html) {
  html.on('click', '.zh-expandable', (event) => {
    event.currentTarget.classList.toggle('zh-collapsed');
  });
}

export function addLocalChatListeners(message, html, data) {
  const flags = message?.flags?.blackbirds;
  if (flags) {
    enableChatButtons(html, flags, message, data);
  }
}

function enableChatButtons(html, flags, message, data) {
  if (flags?.analytics && game.settings.get('blackbirds', 'systemId') === '') {
    html.find('.analytics-agree').prop('disabled', false);
    html.find('.analytics-decline').prop('disabled', false);
    $(html).on('click', '.analytics-agree', (event) => {
      game.settings.set('blackbirds', 'systemId', BlackbirdsUtils.uuidv4());
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ alias: 'F&H Development' }),
        flags: {
          blackbirds: {
            img: 'systems/blackbirds/assets/icons/informer.svg',
            analytics: {},
          },
        },
        whisper: [game.user.id],
        content: `Thank you for participating! 🖤<br/> 
        Please also help us by <a href="https://forms.gle/hTJkMoevk6TzSKmk7" target="_blank">answering this question about which premium content you would be interested in</a>!
        <p>
        If you would like to receive more news about the system, <a href="https://discord.gg/QP5Ke8ND" target="_blank">visit our channel on the official Zweihänder Discord</a>!
        </p>
        `,
      });
      sendAnalytics();
    });
    $(html).on('click', '.analytics-decline', (event) => {
      game.settings.set('blackbirds', 'systemId', 'no-analytics');
      message.update({ 'flags.blackbirds.analytics.answered': true });
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ alias: 'F&H Development' }),
        flags: {
          blackbirds: {
            img: 'systems/blackbirds/assets/icons/informer.svg',
            analytics: {},
          },
        },
        whisper: [game.user.id],
        content: `You will not participate and we won't ask you again!<br/> 
        However, we would like to ask you to <a href="https://forms.gle/hTJkMoevk6TzSKmk7" target="_blank">answer a question about which premium content you would be interested in</a>!
        <p>
        If you would like to receive more news about the system, <a href="https://discord.gg/QP5Ke8ND" target="_blank">visit our channel on the official Zweihänder Discord</a>!
        </p>`,
      });
    });
  }
  const skillTestData = flags?.skillTestData;
  if (skillTestData) {
    const { outcome, actorId, skillItemId, testType, testConfiguration } = skillTestData;
    const actor = game.actors.get(actorId);
    // enable re-roll button
    if (
      (game.user.isGM || actorId === BlackbirdsUtils.determineCurrentActorId()) &&
      outcome !== BlackbirdsDice.OUTCOME_TYPES.CRITICAL_FAILURE
    ) {
      html.find('.skill-test-reroll').prop('disabled', false);
      $(html).on('click', '.skill-test-reroll', (event) => {
        BlackbirdsDice.reRollTest(actorId, skillItemId, testType, testConfiguration, { showDialog: event.shiftKey });
      });
    }
    // enable damage button
    if (
      (game.user.isGM || actorId === BlackbirdsUtils.determineCurrentActorId()) &&
      BlackbirdsDice.isSuccess(outcome)
    ) {
      html.find('.skill-test-damage').prop('disabled', false);
      $(html).on('click', '.skill-test-damage', (event) => {
        BlackbirdsDice.rollWeaponDamage(actorId, testConfiguration);
      });
    }
    // enable parry button
    if (
      (game.user.isGM || actorId !== BlackbirdsUtils.determineCurrentActorId()) &&
      BlackbirdsDice.isSuccess(outcome)
    ) {
      html.find('.skill-test-parry').prop('disabled', false);
      $(html).on('click', '.skill-test-parry', (event) => {
        BlackbirdsDice.rollCombatReaction('parry', actorId, testConfiguration);
      });
    }
    // enable dodge button
    if (
      (game.user.isGM || actorId !== BlackbirdsUtils.determineCurrentActorId()) &&
      BlackbirdsDice.isSuccess(outcome)
    ) {
      html.find('.skill-test-dodge').prop('disabled', false);
      $(html).on('click', '.skill-test-dodge', (event) => {
        BlackbirdsDice.rollCombatReaction('dodge', actorId, testConfiguration);
      });
    }
  }
  const weaponTestData = flags?.weaponTestData;
  if (weaponTestData) {
    const actorId = weaponTestData.actorId;
    const showExplodingButtons =
      !weaponTestData.exploded || game.settings.get('blackbirds', 'unlimitedFortuneExplodes');
    if ((game.user.isGM || actorId == BlackbirdsUtils.determineCurrentActorId()) && showExplodingButtons) {
      html.find('.damage-roll-explode').prop('disabled', false);
      $(html).on('click', '.damage-roll-explode', (event) => {
        BlackbirdsDice.explodeWeaponDamage(message, 'fortune');
      });
    }
    if (game.user.isGM && showExplodingButtons) {
      html.find('.damage-roll-explode-misfortune').prop('disabled', false);
      $(html).on('click', '.damage-roll-explode-misfortune', (event) => {
        BlackbirdsDice.explodeWeaponDamage(message, 'misfortune');
      });
    }
  }

  const spellTestData = flags?.skillTestData?.testType === 'spell' && flags?.skillTestData;
  if (spellTestData) {
    const actorId = spellTestData.actorId;
    const actor = game.actors.get(actorId);

    html.find('.inline-roll').each(async function () {
      const formula = $(this).text().trim().split('+');
      const diceRoll = formula[0];
      const dataPath = formula[1];

      if (dataPath && dataPath.includes('@')) {
        const newFormula = diceRoll + '+' + (await BlackbirdsUtils.parseDataPaths(dataPath, actor));
        this.dataset.formula = newFormula;
        $(this).html('<i class="fas fa-dice-d20"></i> ' + newFormula);
      }
    });
  }
}
