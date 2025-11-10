import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('random')
    .setDescription('Activa o desactiva el modo aleatorio para la cola')
    .addStringOption(option =>
      option.setName('accion')
        .setDescription('Activar o desactivar modo aleatorio')
        .setRequired(true)
        .addChoices(
          { name: 'Activar', value: 'on' },
          { name: 'Desactivar', value: 'off' }
        )),

  async execute(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ 
        content: '❌ Debes estar en un canal de voz para usar este comando.', 
        ephemeral: true 
      });
    }

    const musicManager = client.musicManager;
    const accion = interaction.options.getString('accion');
    
    const queue = musicManager.getQueue(interaction.guildId);
    
    if (queue.songs.length <= 1) {
      return interaction.reply({ 
        content: '❌ No hay suficientes canciones en la cola.', 
        ephemeral: true 
      });
    }

    musicManager.setShuffle(interaction.guildId, accion === 'on');
    
    if (accion === 'on') {
      return interaction.reply('🔀 Modo aleatorio activado. La cola ha sido mezclada.');
    } else {
      return interaction.reply('🔀 Modo aleatorio desactivado.');
    }
  }
};
