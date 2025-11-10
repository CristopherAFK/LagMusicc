import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa la reproducción actual'),

  async execute(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ 
        content: '❌ Debes estar en un canal de voz para usar este comando.', 
        ephemeral: true 
      });
    }

    const musicManager = client.musicManager;
    
    if (!musicManager.hasPermission(interaction.guildId, interaction.user.id)) {
      return interaction.reply({ 
        content: '❌ No tienes permisos para pausar la música. Solo el creador del canal o usuarios con permisos pueden hacerlo.', 
        ephemeral: true 
      });
    }

    if (musicManager.pause(interaction.guildId)) {
      return interaction.reply('⏸️ Reproducción pausada.');
    } else {
      return interaction.reply({ 
        content: '❌ No hay nada reproduciéndose.', 
        ephemeral: true 
      });
    }
  }
};
