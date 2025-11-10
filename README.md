# Bot de Música para Discord

Bot de música avanzado para Discord con múltiples funcionalidades y soporte para varias plataformas de streaming.

## 🎵 Características

### Reproducción Básica
- **`/play [cancion]`** - Reproduce una canción desde YouTube, Spotify u otras plataformas
- **`/play playlist:[url]`** - Reproduce playlists completas de YouTube o Spotify
- **`/pause`** - Pausa la reproducción actual
- **`/resume`** - Reanuda la reproducción
- **`/skip`** - Salta a la siguiente canción (requiere permisos)

### Modos de Reproducción
- **`/bucle [on/off]`** - Activa o desactiva el bucle de la canción actual
- **`/random [on/off]`** - Activa o desactiva el modo aleatorio de la cola
- **`/any`** - Reproduce una canción aleatoria de la cola actual

### Sistema de Permisos y Votación
- **`/voteskip`** - Vota para saltar la canción (requiere más de la mitad de votos)
- **`/addpermiss [usuario]`** - El creador del canal otorga permisos a otro usuario
- **`/clear`** - Limpia la cola de reproducción (requiere permisos)

### Características Especiales
- **`/karaoke [cancion]`** - Busca y reproduce la versión karaoke de una canción
- **`/help`** - Muestra todos los comandos disponibles

## 🔐 Sistema de Permisos

El bot utiliza un sistema de permisos basado en el creador del canal de voz:

1. **Creador del Canal**: La primera persona que entra a un canal de voz vacío se convierte en el "creador"
   - Puede usar `/skip` directamente sin votación
   - Puede usar `/pause`, `/resume`, `/clear`
   - Puede otorgar permisos a otros con `/addpermiss`

2. **Usuarios con Permisos**: Usuarios que recibieron permisos del creador
   - Pueden usar `/skip`, `/pause`, `/resume`, `/clear`

3. **Usuarios Normales**: Todos los demás usuarios
   - Pueden usar `/play`, `/voteskip` y comandos de visualización
   - Necesitan votar con `/voteskip` (requiere más del 50% de votos)

## 🎯 Restricciones

- El bot solo funciona en el servidor con ID: `1212886282645147768`
- El comando `/help` solo funciona en:
  - Canales de voz
  - Canal #1422809286417059850
  - Canal #1222966360263626865

## 🚀 Plataformas Soportadas

- YouTube (videos y playlists)
- Spotify (canciones y playlists)
- Otras plataformas compatibles con play-dl

## 🔧 Configuración

1. Asegúrate de tener configurado `DISCORD_BOT_TOKEN` en los secretos de Replit
2. El bot se conectará automáticamente al iniciar
3. Los comandos slash se registran automáticamente en tu servidor

## 📋 Intents Requeridos

Para que el bot funcione correctamente, necesitas activar estos intents en el Discord Developer Portal:

- ✅ MESSAGE CONTENT INTENT
- ✅ SERVER MEMBERS INTENT
- ✅ PRESENCE INTENT

## 🎮 Permisos del Bot

El bot necesita los siguientes permisos en Discord:
- Ver canales
- Enviar mensajes
- Conectarse a canales de voz
- Hablar en canales de voz
- Usar comandos de aplicación

## 💡 Notas Importantes

- El bot se desconecta automáticamente cuando todos los usuarios salen del canal de voz
- La cola se limpia automáticamente cuando el bot se desconecta
- Las votaciones para saltar se reinician después de cada canción
- El modo bucle reproduce la canción actual indefinidamente hasta que se desactive

## 🛠️ Tecnologías Utilizadas

- **discord.js v14** - Librería principal de Discord
- **@discordjs/voice** - Manejo de conexiones de voz
- **play-dl** - Streaming desde múltiples plataformas
- **spotify-url-info** - Información de Spotify
- **ffmpeg-static** - Procesamiento de audio
- **Node.js 20** - Runtime

## 📝 Desarrollado para

Este bot está configurado específicamente para funcionar con el bot TempVoice, que gestiona canales de voz temporales.
