import { SlashCommandBuilder } from 'discord.js';
import { config } from '../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('voteskip')
    .setDescription('Vota para saltar la canción actual'),

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
    
    if (!queue.isPlaying) {
      return interaction.reply({ 
        content: '❌ No hay nada reproduciéndose.', 
        ephemeral: true 
      });
    }

    const members = voiceChannel.members.filter(m => !m.user.bot);
    const memberCount = members.size;
    
    const votes = musicManager.addVoteSkip(interaction.guildId, interaction.user.id);
    const required = Math.floor(memberCount / 2) + 1;
    
    if (votes >= required) {
      musicManager.clearVoteSkip(interaction.guildId);
      musicManager.skip(interaction.guildId, voiceChannel);
      return interaction.reply(`✅ Votación exitosa! (${votes}/${memberCount}) - Saltando canción...`);
    } else {
      return interaction.reply(`🗳️ Voto registrado (${votes}/${required} necesarios para saltar)`);
    }
  }
};
