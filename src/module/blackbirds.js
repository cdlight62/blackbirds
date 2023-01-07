/**
 * An implementation of the Zweihänder Grim & Perilous RPG system for FoundryVTT
 * Authors: Re4XN, kxfin
 */

import '../index.scss';

import BlackbirdsActor from './actor/actor';
import BlackbirdsCharacterSheet from './actor/sheet/character-sheet';
import BlackbirdsNpcSheet from './actor/sheet/npc-sheet';
import BlackbirdsCreatureSheet from './actor/sheet/creature-sheet';
import BlackbirdsItem from './item/item';
import BlackbirdsItemSheet from './item/sheet/item-sheet';
import FortuneTracker from './apps/fortune-tracker';
import * as BlackbirdsUtils from './utils';
import * as BlackbirdsChat from './chat';

import { registerSystemSettings } from './settings';
import { preloadHandlebarsTemplates } from './templates';
import { registerHandlebarHelpers } from './helpers';
import { migrateWorldSafe, migrateWorld } from './migration';
import { rollTest, patchDie } from './dice';
import { getTestConfiguration } from './apps/test-config';
import { createItemMacro, rollItemMacro } from './macros';

import { ZWEI } from './config';

import { displayHelpMessage } from './misc/help';

import { triggerAnalytics } from './analytics';
import BlackbirdsCombat from './combat/combat';
import BlackbirdsCombatant from './combat/combatant';
import BlackbirdsCombatTracker from './combat/combat-tracker';
import BlackbirdsActiveEffect from './effects/active-effect';
import BlackbirdsActiveEffectConfig from './apps/active-effect-config';

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

CONFIG.compatibility.mode = CONST.COMPATIBILITY_MODES.SILENT;

const socket = new Promise((resolve) => {
  Hooks.once('socketlib.ready', () => {
    resolve(socketlib.registerSystem('blackbirds'));
  });
});

Hooks.once('ready', function () {
  // this is necessary to apply the theme settings
  // TODO: refactor into own utility-function/class
  let sheetStyles = game.settings.get('blackbirds', 'theme');
  game.settings.set('blackbirds', 'theme', sheetStyles);
  migrateWorldSafe();
  socket.then((socket) => {
    game.blackbirds.socket = socket;
    FortuneTracker.INSTANCE = new FortuneTracker(socket);
    FortuneTracker.INSTANCE?.syncState();
    socket.register('updateChatMessage', (messageId, diffData) => {
      game.messages.get(messageId).update(diffData);
    });
  });
  // game.actors.getName('Demon Archer')?.sheet?.render?.(true);
  // Monkey-Patch Search Filter
  const cleanQuery = SearchFilter.cleanQuery;
  SearchFilter.cleanQuery = (x) => BlackbirdsUtils.removeDiacritics(cleanQuery(x));
  // disable analytics temporarily until I get the chance to update my SSL certificate
  // triggerAnalytics();
  //..
  const currencySettings = game.settings.get('blackbirds', 'currencySettings');
  // migration, remove this after a while
  if (currencySettings[0].abbreviation === 'gc' && currencySettings[0].equivalentOfLower === 10) {
    currencySettings[0].equivalentOfLower = 20;
    game.settings.set('blackbirds', 'currencySettings', currencySettings);
  }
  // patch die class
  patchDie();
  console.log(`systems/blackbirds/assets/${game.settings.get('blackbirds', 'gameSystem')}-logo.webp`);
  $('#ui-left #logo')
    .attr('src', `systems/blackbirds/assets/${game.settings.get('blackbirds', 'gameSystem')}-logo.webp`)
    .css('display', 'unset');

  // macro bar support
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

Hooks.once('diceSoNiceReady', function () {
  // Dice so Nice integration
  game?.dice3d?.addSFXTrigger?.('zh-outcome', 'Blackbirds d100', [
    'Critical Failure',
    'Failure',
    'Success',
    'Critical Success',
  ]);
});

Hooks.once('init', async function () {
  // CONFIG.debug.hooks = true;
  console.log(ZWEI.debugTitle);

  game.blackbirds = {
    BlackbirdsActor,
    BlackbirdsItem,
    utils: BlackbirdsUtils,
    migrateWorld,
    rollItemMacro,
  };
  CONFIG.ChatMessage.template = 'systems/blackbirds/src/templates/chat/chat-message.hbs';
  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d10 + @stats.secondaryAttributes.initiative.value',
    decimals: 2,
  };
  CONFIG.TinyMCE.skin_url = 'systems/blackbirds/tinymce/skins/ui/blackbirds';
  CONFIG.TinyMCE.skin = 'blackbirds';
  CONFIG.TinyMCE.content_css = ['/css/mce.css', 'systems/blackbirds/tinymce/skins/content/blackbirds/content.css'];
  CONFIG.statusEffects = ZWEI.statusEffects;
  CONFIG.ZWEI = ZWEI;
  // Define custom Document classes
  CONFIG.Actor.documentClass = BlackbirdsActor;
  CONFIG.Item.documentClass = BlackbirdsItem;
  CONFIG.ActiveEffect.documentClass = BlackbirdsActiveEffect;
  // CONFIG.Combat.documentClass = BlackbirdsCombat;
  // CONFIG.Combatant.documentClass = BlackbirdsCombatant;
  // CONFIG.ui.combat = BlackbirdsCombatTracker;
  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('blackbirds', BlackbirdsCharacterSheet, {
    types: ['character'],
    makeDefault: true,
  });
  Actors.registerSheet('blackbirds', BlackbirdsNpcSheet, {
    types: ['npc'],
    makeDefault: true,
  });
  Actors.registerSheet('blackbirds', BlackbirdsCreatureSheet, {
    types: ['creature'],
    makeDefault: true,
  });

  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('blackbirds', BlackbirdsItemSheet, { makeDefault: true });

  DocumentSheetConfig.unregisterSheet(ActiveEffect, 'core', ActiveEffectConfig);
  DocumentSheetConfig.registerSheet(ActiveEffect, 'zweihader', BlackbirdsActiveEffectConfig, {
    makeDefault: true,
  });
  // Register settings
  registerSystemSettings();
  // Register Helpers
  await registerHandlebarHelpers();
  // Register Templates
  return preloadHandlebarsTemplates();
});

Hooks.on('renderChatMessage', BlackbirdsChat.addLocalChatListeners);
Hooks.on('renderChatLog', (app, html, data) => BlackbirdsChat.addGlobalChatListeners(html));
Hooks.on('updateCompendium', async (pack, documents, options, userId) => {
  const skillPackId = game.settings.get('blackbirds', 'skillPack');
  if (`${pack.metadata.package}.${pack.metadata.name}` === skillPackId) {
    BlackbirdsUtils.updateActorSkillsFromPack(skillPackId);
  }
});

//TODO refactor to other file
Hooks.on('chatCommandsReady', function (chatCommands) {
  chatCommands.registerCommand(
    chatCommands.createCommandFromData({
      commandKey: '/test',
      invokeOnCommand: async (chatlog, messageText, chatdata) => {
        const actors = game.user.isGM
          ? game.canvas.tokens.controlled.map((t) => t.actor)
          : [game.actors.get(BlackbirdsUtils.determineCurrentActorId(true))];
        let testConfiguration;
        if (actors.length === 0) {
          ui.notifications.warn(`Please select a token in order to perform this action!`);
        }
        for (let actor of actors) {
          const skillItem = actor?.items?.find?.(
            (i) => i.type === 'skill' && BlackbirdsUtils.normalizedEquals(i.name, messageText)
          );
          if (skillItem) {
            if (!testConfiguration) {
              testConfiguration = await getTestConfiguration(skillItem);
            }
            await rollTest(skillItem, 'skill', testConfiguration);
          } else if (actor) {
            ui.notifications.warn(`Couldn't find a skill named ${messageText}`);
            break;
          }
        }
      },
      shouldDisplayToChat: false,
      iconClass: 'fa-comment-dots',
      description: 'Do a Skill Test',
    })
  );
  if (game.user.isGM) {
    chatCommands.registerCommand(
      chatCommands.createCommandFromData({
        commandKey: '/nextSession',
        invokeOnCommand: async (chatlog, messageText, chatdata) => {
          const nextSession = new Date(messageText);
          const response = await foundry.utils.fetchJsonWithTimeout(foundry.utils.getRoute('setup'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: game.world.id,
              nextSession: nextSession.toISOString(),
              action: 'editWorld',
            }),
          });
          game.world.updateSource(response);
          await ChatMessage.create({
            flavor: 'Setting the date for the next session.',
            content: `
              <h2>Next Session Date</h2>
            The next session will be on ${nextSession.toLocaleDateString()}.
            Please block the date in your calendars.
            `,
          });
        },
        shouldDisplayToChat: false,
        iconClass: 'fa-calendar',
        description: 'Set the date for the next session',
      })
    );
  }
  chatCommands.registerCommand(
    chatCommands.createCommandFromData({
      commandKey: '/help',
      invokeOnCommand: displayHelpMessage,
      shouldDisplayToChat: false,
      iconClass: 'fa-question',
      description: 'Show System Documentation',
    })
  );
});

Hooks.once('polyglot.init', (LanguageProvider) => {
  class BlackbirdsLanguageProvider extends LanguageProvider {
    getUserLanguages(actor) {
      let known_languages = new Set();
      let literate_languages = new Set();
      actor.system.languages.forEach((l) => {
        known_languages.add(l.name.toLowerCase());
        if (l.isLiterate) {
          literate_languages.add(l.name.toLowerCase());
        }
      });
      return [known_languages, literate_languages];
    }
    conditions(polyglot, lang) {
      return polyglot.literate_languages.has(lang);
    }
  }
  game.polyglot.registerSystem('blackbirds', BlackbirdsLanguageProvider);
});

export let _module = null;

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      _module = newModule._module;
    }
  });
}
