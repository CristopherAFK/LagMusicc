import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('any')
    .setDescription('Reproduce una canción aleatoria de la cola actual'),

  async execute(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ 
        content: '❌ Debes estar en un canal de voz para usar este comando.', 
        ephemeral: true 
      });
    }

    const musicManager = client.musicManager;
    const queue = musicManager.getQueue(interaction.guildId);
    
    if (queue.songs.length <= 1) {
      return interaction.reply({ 
        content: '❌ No hay suficientes canciones en la cola para reproducir una aleatoria.', 
        ephemeral: true 
      });
    }

    if (musicManager.playRandom(interaction.guildId, voiceChannel)) {
      return interaction.reply('🎲 Reproduciendo una canción aleatoria de la cola...');
    } else {
      return interaction.reply({ 
        content: '❌ No se pudo reproducir una canción aleatoria.', 
        ephemeral: true 
      });
    }
  }
};
