import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta a la siguiente canción'),

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
        content: '❌ No tienes permisos para saltar canciones. Solo el creador del canal o usuarios con permisos pueden hacerlo. Usa /voteskip para votar.', 
        ephemeral: true 
      });
    }

    const queue = musicManager.getQueue(interaction.guildId);
    
    if (!queue.isPlaying) {
      return interaction.reply({ 
        content: '❌ No hay nada reproduciéndose.', 
        ephemeral: true 
      });
    }

    musicManager.clearVoteSkip(interaction.guildId);

    if (musicManager.skip(interaction.guildId, voiceChannel)) {
      return interaction.reply('⏭️ Canción saltada.');
    } else {
      return interaction.reply({ 
        content: '❌ No hay más canciones en la cola.', 
        ephemeral: true 
      });
    }
  }
};
