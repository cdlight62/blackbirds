import { ZWEI } from './config';
import { updateActorSkillsFromPack } from './utils';
import FortuneTrackerSettings from './apps/fortune-tracker-settings';
import CurrencySettings from './apps/currency-settings';

export const debouncedReload = foundry.utils.debounce(() => window.location.reload(), 500);

export const registerSystemSettings = function () {
  /* -------------------------------------------- */
  /*  System settings registration                */
  /* -------------------------------------------- */

  game.settings.register('blackbirds', 'gameSystem', {
    name: 'Game System',
    hint: 'Choose the specific implementation of the Blackbirds d100 system you want to play',
    scope: 'world',
    type: String,
    default: 'blackbirds',
    choices: ZWEI.supportedGameSystems,
    config: true,
    onChange: debouncedReload,
  });

  game.settings.register('blackbirds', 'systemMigrationVersion', {
    name: 'System Migration Version',
    scope: 'world',
    config: false,
    type: String,
    default: '',
  });

  game.settings.register('blackbirds', 'encumbranceNineForOne', {
    name: 'Small Item Encumbrance',
    hint: 'Enable or disable rule for small item Encumbrance, where 9 small items add up to 1 point of Encumbrance.',
    scope: 'world',
    type: Boolean,
    default: true,
    config: true,
  });

  game.settings.register('blackbirds', 'trackRewardPoints', {
    name: 'Automatically Track Reward Points',
    hint: 'Enable or disable the automatic tracking of Reward Point expenditure.',
    scope: 'world',
    type: Boolean,
    default: true,
    config: true,
  });

  game.settings.register('blackbirds', 'injuryPrompt', {
    name: 'Automatic Injury Prompt',
    hint: 'Automatically prompt user to roll for Injury when falling on the Damage Condition Track.',
    scope: 'world',
    type: Boolean,
    default: true,
    config: true,
  });

  game.settings.register('blackbirds', 'openInCompactMode', {
    name: 'Open in Compact Mode',
    hint: 'Creature & NPC Sheets will be opened in Compact Mode by default',
    scope: 'client',
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register('blackbirds', 'systemId', {
    name: 'systemId',
    scope: 'global',
    type: String,
    default: '',
    config: false,
  });

  game.settings.register('blackbirds', 'skillPack', {
    name: 'Skill List',
    hint: 'ID of the compendium pack to use for the list of available skills for new actors.',
    scope: 'world',
    type: String,
    default: 'blackbirds.skills',
    config: true,
    onChange: updateActorSkillsFromPack,
  });

  game.settings.register('blackbirds', 'unlimitedFortuneExplodes', {
    name: 'Unlimited Fortune Explodes',
    hint: 'Enable to allow to explode fury dice more than once per attack.',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register('blackbirds', 'theme', {
    name: 'Blackbirds Sheet Theme',
    hint: 'Choose a theme for your Blackbirds sheets',
    scope: 'client',
    type: String,
    default: 'gruvbox-dark',
    choices: {
      'gruvbox-dark': 'Gruvbox Dark',
      'gruvbox-light': 'Gruvbox Light',
    },
    config: true,
    onChange: (theme) => {
      $('body.system-blackbirds').addClass('blackbirds-theme-' + theme);
      $('body.system-blackbirds').removeClass((i, c) =>
        c.split(' ').filter((c) => c.startsWith('blackbirds-theme-') && c !== 'blackbirds-theme-' + theme)
      );
    },
  });

  game.settings.register('blackbirds', 'fortuneTrackerPersistedState', {
    scope: 'world',
    config: false,
    type: Object,
    default: {
      total: 0,
      used: 0,
      removed: 0,
    },
  });
  game.settings.register('blackbirds', 'fortuneTrackerSettings', {
    scope: 'world',
    config: false,
    type: Object,
    default: {
      removeUsedMisfortune: false,
      notifications: 'notify',
      size: 'normal',
      fortunePath: '/systems/blackbirds/assets/fortune-life.webp',
      misfortunePath: '/systems/blackbirds/assets/fortune-death.webp',
    },
  });
  game.settings.registerMenu('blackbirds', 'fortuneTrackerSettingsMenu', {
    name: 'Fortune Tracker Settings',
    label: 'Fortune Tracker Settings', // The text label used in the button
    hint: 'Configure the look & behavior of the Fortune Tracker.',
    icon: 'ra ra-scroll-unfurled', // A Font Awesome icon used in the submenu button
    type: FortuneTrackerSettings, // A FormApplication subclass
    restricted: true, // Restrict this submenu to gamemaster only?
  });
  game.settings.register('blackbirds', 'currencySettings', {
    scope: 'world',
    config: false,
    type: Array,
    default: [
      {
        abbreviation: 'gc',
        name: 'Gold Coins',
        equivalentOfLower: 20,
        color: '#fabd2f',
      },
      {
        abbreviation: 'ss',
        name: 'Silver Shilling',
        equivalentOfLower: 12,
        color: '#928374',
      },
      {
        abbreviation: 'bp',
        name: 'Brass Pennies',
        equivalentOfLower: 0,
        color: '#d65d0e',
      },
    ],
  });
  game.settings.registerMenu('blackbirds', 'currencySettingsMenu', {
    name: 'Currency Settings',
    label: 'Currency Settings', // The text label used in the button
    hint: 'Configure the types and conversion rates of currency in your world',
    icon: 'fas fa-coins', // A Font Awesome icon used in the submenu button
    type: CurrencySettings, // A FormApplication subclass
    restricted: true, // Restrict this submenu to gamemaster only?
  });
};
