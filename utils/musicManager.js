import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  AudioPlayerStatus,
  getVoiceConnection
} from "@discordjs/voice";
import play from "play-dl";

export class MusicManager {
  constructor() {
    this.queue = new Map(); // guildId => { voiceChannel, textChannel, songs, connection, player, playing }
    console.log("✅ play-dl inicializado correctamente");
  }

  async playSong(guild, song) {
    const serverQueue = this.queue.get(guild.id);
    if (!song) {
      serverQueue.connection.destroy();
      this.queue.delete(guild.id);
      return;
    }

    try {
      // 📥 Obtener info del video correctamente
      let ytInfo;
      if (play.yt_validate(song.url) === "video") {
        ytInfo = await play.video_info(song.url);
      } else {
        const results = await play.search(song.url, { limit: 1 });
        if (!results || results.length === 0)
          throw new Error("No se encontró la canción.");
        ytInfo = await play.video_info(results[0].url);
      }

      // 🎧 Obtener stream válido para Discord
      const stream = await play.stream(ytInfo.video_details.url, {
        discordPlayerCompatibility: true
      });
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type
      });

      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play
        }
      });

      player.play(resource);
      serverQueue.connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        serverQueue.songs.shift();
        this.playSong(guild, serverQueue.songs[0]);
      });

      player.on("error", (error) => {
        console.error(`Error en el reproductor: ${error.message}`);
        serverQueue.songs.shift();
        this.playSong(guild, serverQueue.songs[0]);
      });

      serverQueue.player = player;
      console.log(`🎵 Reproduciendo: ${ytInfo.video_details.title}`);
      serverQueue.textChannel.send({
        content: `🎶 Reproduciendo ahora: **${ytInfo.video_details.title}**`
      });
    } catch (error) {
      console.error(`❌ Error al reproducir: ${error}`);
      serverQueue.textChannel.send({
        content: `❌ Error al reproducir: ${error.message}`
      });
      serverQueue.songs.shift();
      this.playSong(guild, serverQueue.songs[0]);
    }
  }

  async execute(interaction, song) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel)
      return interaction.reply({
        content: "❌ Debes estar en un canal de voz para usar este comando.",
        ephemeral: true
      });

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (
      !permissions.has("Connect") ||
      !permissions.has("Speak")
    ) {
      return interaction.reply({
        content: "❌ No tengo permisos para unirme o hablar en ese canal.",
        ephemeral: true
      });
    }

    const serverQueue = this.queue.get(interaction.guild.id);
    const songData = {
      title: song.title || "Desconocido",
      url: song.url
    };

    if (!serverQueue) {
      const queueConstruct = {
        textChannel: interaction.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true
      };

      this.queue.set(interaction.guild.id, queueConstruct);
      queueConstruct.songs.push(songData);

      try {
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator
        });
        queueConstruct.connection = connection;
        this.playSong(interaction.guild, queueConstruct.songs[0]);
        await interaction.reply({
          content: `🎵 Añadido a la cola: **${songData.title}**`
        });
      } catch (error) {
        console.error(`❌ Error al conectar: ${error}`);
        this.queue.delete(interaction.guild.id);
        return interaction.reply({
          content: "❌ Ocurrió un error al intentar unirme al canal de voz."
        });
      }
    } else {
      serverQueue.songs.push(songData);
      return interaction.reply({
        content: `🎶 Añadido a la cola: **${songData.title}**`
      });
    }
  }

  stop(guild) {
    const serverQueue = this.queue.get(guild.id);
    if (!serverQueue) return;
    serverQueue.songs = [];
    if (serverQueue.player) serverQueue.player.stop();
    const connection = getVoiceConnection(guild.id);
    if (connection) connection.destroy();
    this.queue.delete(guild.id);
  }
}

export const musicManager = new MusicManager();
