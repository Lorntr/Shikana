const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const axios = require('axios'); // Вам понадобится установить этот пакет: npm install axios
const PING_INTERVAL_MS = 8 * 60 * 1000; // 8 минут в миллисекундах (меньше, чем 10 минут)
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const { token } = require('./config.json');

const Database = require('better-sqlite3');
const { db } = require('./databaseFunctions');

const client = new Client({ intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
]});

client.commands = new Collection(); 

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

function selfPing() {
    const urlToPing = process.env.HOST_URL || `http://localhost:${process.env.PORT || 4000}`; 

    axios.get(urlToPing)
        .then(() => {
            console.log(`[PING] Успешный пинг на ${urlToPing} в ${new Date().toLocaleTimeString()}`);
        })
        .catch((error) => {
            console.error(`[PING] Ошибка при пинге: ${error.message}`);
        });
}

setInterval(selfPing, PING_INTERVAL_MS);

setTimeout(selfPing, 30000);

const app = express()
const port = process.env.PORT || 4000 

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

client.login(token);