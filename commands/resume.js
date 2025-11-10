import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Reanuda la reproducción'),

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
        content: '❌ No tienes permisos para reanudar la música. Solo el creador del canal o usuarios con permisos pueden hacerlo.', 
        ephemeral: true 
      });
    }

    if (musicManager.resume(interaction.guildId)) {
      return interaction.reply('▶️ Reproducción reanudada.');
    } else {
      return interaction.reply({ 
        content: '❌ No hay nada en pausa.', 
        ephemeral: true 
      });
    }
  }
};
