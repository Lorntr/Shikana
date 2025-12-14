const { Events } = require('discord.js');
const axios = require('axios');
const PING_INTERVAL_MS = 8 * 60 * 1000;

const PING_URL = process.env.PUBLIC_URL || 'https://shikana.onrender.com';

function externalPing() {
    if (!PING_URL) {
        console.warn("[PING] ВНИМАНИЕ: Переменная окружения PING_URL не установлена. Пингование не работает.");
        return;
    }

    axios.get(PING_URL)
        .then(() => {
            console.log(`[PING SUCCESS] Успешный внешний пинг на ${PING_URL} в ${new Date().toLocaleTimeString()}`);
        })
        .catch((error) => {
            console.error(`[PING ERROR] Ошибка при внешнем пинге на ${PING_URL}: ${error.message}`);
        });
}

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		if (PING_URL) {
		    setTimeout(externalPing, 30000); 
		    
		    setInterval(externalPing, PING_INTERVAL_MS);
		    console.log(`[PING] Запущено внешнее пингование каждые ${PING_INTERVAL_MS / 60000} минут на URL: ${PING_URL}`);
		} else {
		     console.warn("[PING] Внешнее пингование не запущено, так как PING_URL не задан.");
		}
		
		console.log(`\n\n✅ УСПЕХ: Сканирование при запуске завершено.`);
		
		const guilds = client.guilds.cache.values();
		
		let totalUsersScanned = 0;

		for (const guild of guilds) {
			console.log(`Сканирование участников на сервере: ${guild.name} (${guild.id})`);

			try {
				const members = await guild.members.fetch(); 
				
				const usersData = members.map(member => {
					if (member.user.bot) return null; 

					return {
						discordId: member.user.id,
						championshipPoints: 0,
						penaltyPoints: 0
					};
				}).filter(Boolean);

				if (usersData.length > 0) {
					const { insertUserBulk } = require('../databaseFunctions');
					insertUserBulk(usersData);
					totalUsersScanned += usersData.length;
				}

			} catch (error) {
				console.error(`Ошибка сканирования сервера ${guild.name}:`, error.message);
			}
		}
		
		console.log(`\n\n✅ УСПЕХ: Сканирование при запуске завершено. Всего добавлено/обновлено ${totalUsersScanned} пользователей.`);
	},
};