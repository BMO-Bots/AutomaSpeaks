const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const webhookChannelId = '1328415638011772950'; // Canale dove il webhook invia i contenuti
const evaluationChannelId = '1328473880725029034'; // Canale per l'accettazione/rifiuto
const acceptedChannelId = '1328831468939640974'; // Canale per i contenuti accettati
const BOT_TOKEN = process.env.TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log(`Bot connesso come ${client.user.tag}`);

    client.user.setPresence({
        status: 'idle',
        activities: [{
            name: 'Leggi BIO | Dev: jes.is-a.dev',
            type: 4, // 'Playing'
        }]
    });
    
    console.log('Status impostato con successo!');

});

client.on('messageCreate', async (message) => {
    console.log(`Ricevuto messaggio da ${message.channel.id}: ${message.content}`);
    console.log(`Autore del messaggio: ${message.author.tag}`);
    console.log(`Numero di allegati: ${message.attachments.size}`);

    // Controlla per allegati o link multimediali
    let mediaUrl = null;

    if (message.attachments.size > 0) {
        mediaUrl = message.attachments.first().url;
        console.log(`URL allegato: ${mediaUrl}`);
    }

    if (!mediaUrl) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = message.content.match(urlRegex);
        if (urls && urls.length > 0) {
            mediaUrl = urls[0];
            console.log(`URL trovato nel contenuto: ${mediaUrl}`);
        }
    }

    if (mediaUrl && message.channel.id === webhookChannelId) {
        const evaluationChannel = await client.channels.fetch(evaluationChannelId);
        const username = message.author.username;

        // Crea i pulsanti Accetta e Rifiuta
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('accept')
                .setLabel('✔')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('reject')
                .setLabel('✗')
                .setStyle(ButtonStyle.Danger)
        );

        const sentMessage = await evaluationChannel.send({
            content: `👤 ${username}\n${mediaUrl}`,
            components: [row]
        });

        const filter = (interaction) => ['accept', 'reject'].includes(interaction.customId);
        const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 });
        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'accept') {
                const acceptedChannel = await client.channels.fetch(acceptedChannelId);
                await acceptedChannel.send(
                    `👤: ${username}\n` +
                    `👮: ||${interaction.user.username}|| ${mediaUrl}`
                );

                // Disattiva i pulsanti e aggiorna il messaggio
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('accept')
                        .setLabel('✔')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('reject')
                        .setLabel('✗')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );

                await sentMessage.edit({
                    content: `✅ACCETTATO✅\n👤 ${username}\n${mediaUrl}`,
                    components: [disabledRow]
                });

                await interaction.reply({ content: 'Inviato!', ephemeral: true });
            } else if (interaction.customId === 'reject') {
                // Disattiva i pulsanti
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('accept')
                        .setLabel('✔')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('reject')
                        .setLabel('✗')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );

                await sentMessage.edit({
                    content: `❌RIFIUTATO❌\n👤 ${username}\n[Audio rimosso]`,
                    components: [disabledRow]
                });

                await interaction.reply({ content: 'Rifiutato!', ephemeral: true });
            }
        });
    } else {
        console.log('Messaggio senza link multimediali o non proveniente dal canale configurato.');
    }
});

client.login(BOT_TOKEN);
