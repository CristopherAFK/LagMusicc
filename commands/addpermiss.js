import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('addpermiss')
    .setDescription('Otorga permisos de control a otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que dar permisos')
        .setRequired(true)),

  async execute(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ 
        content: '❌ Debes estar en un canal de voz para usar este comando.', 
        ephemeral: true 
      });
    }

    const musicManager = client.musicManager;
    const creator = musicManager.getVoiceCreator(interaction.guildId);
    
    if (creator !== interaction.user.id) {
      return interaction.reply({ 
        content: '❌ Solo el creador del canal de voz puede otorgar permisos.', 
        ephemeral: true 
      });
    }

    const targetUser = interaction.options.getUser('usuario');
    
    if (targetUser.bot) {
      return interaction.reply({ 
        content: '❌ No puedes dar permisos a un bot.', 
        ephemeral: true 
      });
    }

    musicManager.addPermission(interaction.guildId, targetUser.id);
    
    return interaction.reply(`✅ Permisos otorgados a ${targetUser.tag}. Ahora puede usar /skip, /pause, /resume y /clear.`);
  }
};
