import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { config } from '../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra todos los comandos disponibles del bot'),

  async execute(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;
    const channelId = interaction.channelId;
    
    const isAllowedChannel = voiceChannel || config.helpChannels.includes(channelId);
    
    if (!isAllowedChannel) {
      return interaction.reply({ 
        content: '❌ Este comando solo funciona en canales de voz o en los canales permitidos.', 
        ephemeral: true 
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('🎵 Comandos del Bot de Música')
      .setDescription('Aquí tienes todos los comandos disponibles:')
      .addFields(
        { 
          name: '🎵 Reproducción Básica', 
          value: '`/play [cancion]` - Reproduce una canción\n`/play playlist:[url]` - Reproduce una playlist\n`/pause` - Pausa la reproducción\n`/resume` - Reanuda la reproducción\n`/skip` - Salta a la siguiente canción (requiere permisos)', 
          inline: false 
        },
        { 
          name: '🔁 Modos de Reproducción', 
          value: '`/bucle [on/off]` - Activa/desactiva el bucle de la canción actual\n`/random [on/off]` - Activa/desactiva modo aleatorio\n`/any` - Reproduce una canción aleatoria de la cola', 
          inline: false 
        },
        { 
          name: '🗳️ Votación y Permisos', 
          value: '`/voteskip` - Vota para saltar la canción (requiere mayoría)\n`/addpermiss [usuario]` - Da permisos a otro usuario (solo creador)\n`/clear` - Limpia la cola de reproducción (requiere permisos)', 
          inline: false 
        },
        { 
          name: '🎤 Especiales', 
          value: '`/karaoke [cancion]` - Busca y reproduce la versión karaoke', 
          inline: false 
        },
        { 
          name: 'ℹ️ Información', 
          value: '• Solo el creador del canal de voz puede usar `/skip` directamente\n• Otros usuarios deben usar `/voteskip` (requiere más de la mitad de votos)\n• El creador puede dar permisos con `/addpermiss`\n• Soporta YouTube, Spotify y otras plataformas', 
          inline: false 
        }
      )
      .setFooter({ text: 'Bot de Música | Disfruta tu música favorita' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
