import 'dotenv/config';
import { Client, GatewayIntentBits, Collection, REST, Routes, Events } from 'discord.js';
import { MusicManager } from './utils/musicManager.js';
import { config } from './config.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import play from 'play-dl';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename  );

await play.getFreeClientID().then((clientID) => {
  play.setToken({
    soundcloud: {
      client_id: clientID
    }
  });
  console.log('✅ play-dl inicializado correctamente');
}).catch(err => {
  console.log('⚠️ No se pudo obtener SoundCloud client ID:', err.message);
});

// Configurar play-dl para SoundCloud
play.setToken({
  youtube: {
    cookie: process.env.YOUTUBE_COOKIE || undefined
  }
}).catch(() => {});
console.log('✅ Configuración de tokens completada');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
client.musicManager = new MusicManager();

const commandFiles = readdirSync(join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.default.data.name, command.default);
}

client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  
  const commands = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
  
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  
  try {
    console.log('🔄 Limpiando comandos antiguos...');
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, config.guildId),
      { body: [] }
    );
    console.log('✅ Comandos antiguos eliminados');
    
    console.log('🔄 Registrando comandos slash nuevos...');
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, config.guildId),
      { body: commands }
    );
    console.log('✅ Comandos registrados correctamente');
  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
});

client.on('voiceStateUpdate', (oldState, newState) => {
  if (newState.channelId && !oldState.channelId) {
    const channel = newState.channel;
    if (channel && channel.members.size === 1) {
      client.musicManager.setVoiceCreator(newState.guild.id, newState.member.id);
      console.log(`🎤 ${newState.member.user.tag} creó/entró al canal de voz ${channel.name}`);
    }
  }
  
  if (!newState.channelId && oldState.channelId) {
    const channel = oldState.channel;
    const remainingMembers = channel ? channel.members.filter(m => !m.user.bot) : [];
    
    if (remainingMembers.size === 0) {
      client.musicManager.disconnect(oldState.guild.id);
      console.log(`🔇 Todos salieron del canal de voz, desconectando...`);
    } else if (client.musicManager.getVoiceCreator(oldState.guild.id) === oldState.member.id) {
      const newCreator = remainingMembers.first();
      if (newCreator) {
        client.musicManager.setVoiceCreator(oldState.guild.id, newCreator.id);
        console.log(`👑 ${newCreator.user.tag} es ahora el creador del canal de voz`);
      }
    }
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  if (interaction.guildId !== config.guildId) {
    return interaction.reply({ 
      content: '❌ Este bot solo funciona en un servidor específico.', 
      ephemeral: true 
    });
  }

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error('Error ejecutando comando:', error);
    const reply = { 
      content: '❌ Hubo un error al ejecutar este comando.', 
      ephemeral: true 
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('❌ Error: DISCORD_BOT_TOKEN no encontrado en las variables de entorno');
  console.log('Por favor, configura tu token de Discord bot en los secretos de Replit');
  process.exit(1);
}

client.login(token).catch(error => {
  console.error('❌ Error al iniciar el bot:', error);
  process.exit(1);
});
