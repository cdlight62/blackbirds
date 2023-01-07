export const displayHelpMessage = async () => {
  const html = await renderTemplate('systems/blackbirds/src/templates/help/index.hbs');
  await ChatMessage.create({
    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    user: game.user.id,
    flavor: 'Index',
    content: html,
    speaker: { ...ChatMessage.getSpeaker(), alias: 'Zweihänder Help' },
    whisper: [game.user.id],
    flags: { blackbirds: { img: 'systems/blackbirds/assets/icons/help.svg' } },
  });
};
