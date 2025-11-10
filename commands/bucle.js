import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bucle')
    .setDescription('Activa o desactiva el modo bucle')
    .addStringOption(option =>
      option.setName('accion')
        .setDescription('Activar o desactivar el bucle')
        .setRequired(true)
        .addChoices(
          { name: 'Activar', value: 'on' },
          { name: 'Desactivar (stop)', value: 'off' }
        )),

  async execute(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ 
        content: '❌ Debes estar en un canal de voz para usar este comando.', 
        ephemeral: true 
      });
    }

    const musicManager = client.musicManager;
    const accion = interaction.options.getString('accion');
    
    const queue = musicManager.getQueue(interaction.guildId);
    
    if (!queue.isPlaying) {
      return interaction.reply({ 
        content: '❌ No hay nada reproduciéndose.', 
        ephemeral: true 
      });
    }

    musicManager.setLoop(interaction.guildId, accion === 'on');
    
    if (accion === 'on') {
      return interaction.reply('🔁 Modo bucle activado. La canción actual se reproducirá indefinidamente.');
    } else {
      return interaction.reply('🔁 Modo bucle desactivado.');
    }
  }
};
