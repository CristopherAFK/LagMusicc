import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una canción')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Nombre, URL de YouTube o URL de playlist')
        .setRequired(true)),

  async execute(interaction, client) {
    const query = interaction.options.getString('query');

    console.log(`🔍 Query recibida: "${query}"`);

    if (!query || query.trim() === '') {
      console.log('❌ Query vacía');
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

    try {
      // Detectar si es una playlist
      if (query.includes('playlist')) {
        console.log(`📋 Cargando playlist: "${query}"`);
        const songs = await musicManager.getPlaylist(query, 'youtube');
        
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
        // Es una canción individual
        console.log(`🔍 Buscando canción: "${query}"`);
        const song = await musicManager.searchSong(query);
        
        if (!song) {
          console.log('❌ No se encontró la canción');
          return interaction.editReply('❌ No se pudo encontrar la canción. Intenta con un link directo de YouTube.');
        }

        console.log(`✅ Canción encontrada: ${song.title}`);
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
          console.log('🎵 Iniciando reproducción...');
          await musicManager.play(interaction.guildId, voiceChannel);
        }
      }
    } catch (error) {
      console.error('❌ Error en comando play:', error);
      return interaction.editReply(`❌ Error: ${error.message}`);
    }
  }
};
