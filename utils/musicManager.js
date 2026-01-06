import {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType
} from '@discordjs/voice';
import play from 'play-dl';

export class MusicManager {
  constructor() {
    this.queues = new Map();
    this.players = new Map();
    this.connections = new Map();
    this.voiceCreators = new Map();
    this.permissions = new Map();
    this.voteSkips = new Map();
  }

  getQueue(guildId) {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, {
        songs: [],
        currentSong: null,
        loop: false,
        shuffle: false,
        isPlaying: false,
        skipShift: false
      });
    }
    return this.queues.get(guildId);
  }

  setVoiceCreator(guildId, userId) {
    this.voiceCreators.set(guildId, userId);
    this.permissions.set(guildId, new Set([userId]));
  }

  getVoiceCreator(guildId) {
    return this.voiceCreators.get(guildId);
  }

  hasPermission(guildId, userId) {
    const creator = this.voiceCreators.get(guildId);
    if (!creator) return true;
    if (creator === userId) return true;
    const perms = this.permissions.get(guildId);
    return perms ? perms.has(userId) : false;
  }

  addPermission(guildId, userId) {
    if (!this.permissions.has(guildId)) {
      this.permissions.set(guildId, new Set());
    }
    this.permissions.get(guildId).add(userId);
  }

  async searchSong(query, isKaraoke = false) {
    try {
      const searchQuery = isKaraoke ? `${query} karaoke` : query;
      
      let video;
      if (query.startsWith('http')) {
        const videoInfo = await play.video_info(query);
        video = videoInfo.video_details;
      } else {
        const searchResults = await play.search(searchQuery, { limit: 1, source: { youtube: 'video' } });
        if (searchResults.length === 0) return null;
        video = searchResults[0];
      }
      
      if (!video || !video.url) {
        console.error('❌ Video data missing or invalid');
        return null;
      }

      return {
        title: video.title,
        url: video.url,
        duration: video.durationInSec || 0,
        thumbnail: video.thumbnails?.[0]?.url || ''
      };
    } catch (error) {
      console.error('Error searching song:', error.message);
      return null;
    }
  }

  async getPlaylist(url, platform) {
    try {
      const playlist = await play.playlist_info(url);
      const videos = await playlist.all_videos();
      return videos.map(video => ({
        title: video.title,
        url: video.url,
        duration: video.durationInSec || 0,
        thumbnail: video.thumbnails?.[0]?.url || ''
      }));
    } catch (error) {
      console.error('Error getting playlist:', error.message);
      return [];
    }
  }

  async play(guildId, voiceChannel) {
    const queue = this.getQueue(guildId);
    
    if (queue.songs.length === 0) {
      queue.isPlaying = false;
      queue.currentSong = null;
      return;
    }

    let player = this.players.get(guildId);
    if (!player) {
      player = createAudioPlayer();
      this.players.set(guildId, player);
      
      player.on(AudioPlayerStatus.Idle, () => {
        this.clearVoteSkip(guildId);
        if (queue.loop && queue.currentSong) {
          this.play(guildId, voiceChannel);
        } else {
          if (!queue.skipShift) {
            queue.songs.shift();
          }
          queue.skipShift = false;
          if (queue.songs.length > 0) {
            this.play(guildId, voiceChannel);
          } else {
            queue.isPlaying = false;
            queue.currentSong = null;
          }
        }
      });

      player.on('error', error => {
        console.error('❌ Player error:', error);
        queue.songs.shift();
        if (queue.songs.length > 0) {
          setTimeout(() => this.play(guildId, voiceChannel), 1000);
        } else {
          queue.isPlaying = false;
          queue.currentSong = null;
        }
      });
    }

    let connection = this.connections.get(guildId);
    if (!connection) {
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });
      this.connections.set(guildId, connection);

      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5000),
          ]);
        } catch (error) {
          connection.destroy();
          this.connections.delete(guildId);
        }
      });
    }

    queue.currentSong = queue.loop ? queue.currentSong : queue.songs[0];
    queue.isPlaying = true;

    try {
      if (!queue.currentSong || !queue.currentSong.url) {
        throw new Error('No song URL available');
      }

      console.log(`🎵 Intentando reproducir: ${queue.currentSong.title}`);
      console.log(`🔗 URL verificada: ${queue.currentSong.url}`);
      
      const stream = await play.stream(queue.currentSong.url, {
        discordPlayerCompatibility: true
      });
      
      console.log(`✅ Stream obtenido: ${stream.type}`);

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true
      });

      connection.subscribe(player);
      player.play(resource);
      console.log(`✅ Reproducción iniciada`);
    } catch (error) {
      console.error('❌ Error crítico en play:', error);
      queue.songs.shift();
      if (queue.songs.length > 0) {
        setTimeout(() => this.play(guildId, voiceChannel), 1000);
      } else {
        queue.isPlaying = false;
        queue.currentSong = null;
      }
    }
  }

  pause(guildId) {
    const player = this.players.get(guildId);
    if (player) {
      player.pause();
      return true;
    }
    return false;
  }

  resume(guildId) {
    const player = this.players.get(guildId);
    if (player) {
      player.unpause();
      return true;
    }
    return false;
  }

  skip(guildId, voiceChannel) {
    const queue = this.getQueue(guildId);
    const player = this.players.get(guildId);
    if (player && queue.songs.length > 0) {
      queue.loop = false;
      player.stop();
      return true;
    }
    return false;
  }

  clear(guildId) {
    const queue = this.getQueue(guildId);
    const currentSong = queue.songs[0];
    queue.songs = currentSong ? [currentSong] : [];
    return true;
  }

  setLoop(guildId, enabled) {
    const queue = this.getQueue(guildId);
    queue.loop = enabled;
  }

  setShuffle(guildId, enabled) {
    const queue = this.getQueue(guildId);
    queue.shuffle = enabled;
    if (enabled && queue.songs.length > 1) {
      const current = queue.songs[0];
      const remaining = queue.songs.slice(1);
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      queue.songs = [current, ...remaining];
    }
  }

  playRandom(guildId, voiceChannel) {
    const queue = this.getQueue(guildId);
    if (queue.songs.length <= 1) return false;
    const remaining = queue.songs.slice(1);
    const randomIndex = Math.floor(Math.random() * remaining.length);
    const randomSong = remaining[randomIndex];
    queue.songs = [randomSong, ...remaining.filter((_, i) => i !== randomIndex)];
    queue.skipShift = true;
    const player = this.players.get(guildId);
    if (player) {
      queue.loop = false;
      player.stop();
    }
    return true;
  }

  initVoteSkip(guildId) {
    if (!this.voteSkips.has(guildId)) {
      this.voteSkips.set(guildId, new Set());
    }
    return this.voteSkips.get(guildId);
  }

  addVoteSkip(guildId, userId) {
    const votes = this.initVoteSkip(guildId);
    votes.add(userId);
    return votes.size;
  }

  clearVoteSkip(guildId) {
    this.voteSkips.delete(guildId);
  }

  getVoteSkipCount(guildId) {
    const votes = this.voteSkips.get(guildId);
    return votes ? votes.size : 0;
  }

  disconnect(guildId) {
    const connection = this.connections.get(guildId);
    if (connection) {
      connection.destroy();
      this.connections.delete(guildId);
    }
    const player = this.players.get(guildId);
    if (player) {
      player.stop();
      this.players.delete(guildId);
    }
    this.queues.delete(guildId);
    this.voteSkips.delete(guildId);
  }
}
