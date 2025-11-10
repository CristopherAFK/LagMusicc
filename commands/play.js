import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una canción o playlist')
    .addStringOption(option =>
      option.setName('cancion')
        .setDescription('Nombre o URL de la canción')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('playlist')
        .setDescription('URL de la playlist (YouTube o Spotify)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('plataforma')
        .setDescription('Plataforma de música')
        .setRequired(false)
        .addChoices(
          { name: 'YouTube', value: 'youtube' },
          { name: 'Spotify', value: 'spotify' }
        )),

  async execute(interaction, client) {
    const cancion = interaction.options.getString('cancion');
    const playlist = interaction.options.getString('playlist');
    const plataforma = interaction.options.getString('plataforma');

    if (!cancion && !playlist) {
      return interaction.reply({ 
        content: '❌ Debes proporcionar una canción o una playlist.', 
        ephemeral: true 
      });
    }

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

    if (playlist) {
      const songs = await musicManager.getPlaylist(playlist, plataforma || 'youtube');
      
      if (songs.length === 0) {
        return interaction.editReply('❌ No se pudo cargar la playlist o está vacía.');
      }

      queue.songs.push(...songs);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Playlist Agregada')
        .setDescription(`Se agregaron **${songs.length}** canciones a la cola`)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      if (!queue.isPlaying) {
        musicManager.play(interaction.guildId, voiceChannel);
      }
    } else {
      const song = await musicManager.searchSong(cancion);
      
      if (!song) {
        return interaction.editReply('❌ No se pudo encontrar la canción.');
      }

      queue.songs.push(song);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(queue.isPlaying ? '➕ Canción Agregada a la Cola' : '🎵 Reproduciendo Ahora')
        .setDescription(`**${song.title}**`)
        .setThumbnail(song.thumbnail)
        .addFields(
          { name: 'Duración', value: `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}`, inline: true },
          { name: 'Posición en cola', value: `${queue.songs.length}`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      if (!queue.isPlaying) {
        musicManager.play(interaction.guildId, voiceChannel);
      }
    }
  }
};
