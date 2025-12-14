const { Events } = require('discord.js');
// Импортируем нашу функцию для массовой вставки (её нужно экспортировать из index.js)
// ПРИМЕЧАНИЕ: Если код базы данных остался в index.js, 
// вам нужно его оттуда экспортировать. Давайте сначала поправим index.js.

// --- Мы пока оставим эту часть пустой и перейдем к index.js ---

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		
		// 1. Находим все гильдии (серверы), к которым подключен бот
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