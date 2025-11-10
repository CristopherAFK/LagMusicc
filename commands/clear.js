import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Limpia la cola de reproducción'),

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
        content: '❌ No tienes permisos para limpiar la cola. Solo el creador del canal o usuarios con permisos pueden hacerlo.', 
        ephemeral: true 
      });
    }

    const queue = musicManager.getQueue(interaction.guildId);
    
    if (queue.songs.length <= 1) {
      return interaction.reply({ 
        content: '❌ No hay canciones en la cola para limpiar.', 
        ephemeral: true 
      });
    }

    musicManager.clear(interaction.guildId);
    
    return interaction.reply('🗑️ Cola de reproducción limpiada. Solo quedará la canción actual.');
  }
};
