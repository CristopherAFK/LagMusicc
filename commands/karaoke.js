import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('karaoke')
    .setDescription('Reproduce la versión karaoke de una canción')
    .addStringOption(option =>
      option.setName('cancion')
        .setDescription('Nombre de la canción en versión karaoke')
        .setRequired(true)),

  async execute(interaction, client) {
    const cancion = interaction.options.getString('cancion');
    
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ 
        content: '❌ Debes estar en un canal de voz para usar este comando.', 
        ephemeral: true 
      });
    }

    await interaction.deferReply();

    const musicManager = client.musicManager;
    const queue = musicManager.getQueue(interaction.guildId);

    const song = await musicManager.searchSong(cancion, true);
    
    if (!song) {
      return interaction.editReply('❌ No se pudo encontrar la versión karaoke de esta canción.');
    }

    queue.songs.push(song);

    const embed = new EmbedBuilder()
      .setColor('#FF00FF')
      .setTitle(queue.isPlaying ? '🎤 Karaoke Agregado a la Cola' : '🎤 Reproduciendo Karaoke')
      .setDescription(`**${song.title}**`)
      .setThumbnail(song.thumbnail)
      .addFields(
        { name: 'Duración', value: `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}`, inline: true },
        { name: 'Posición en cola', value: `${queue.songs.length}`, inline: true }
      )
      .setFooter({ text: '🎤 Versión Karaoke' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    if (!queue.isPlaying) {
      musicManager.play(interaction.guildId, voiceChannel);
    }
  }
};
