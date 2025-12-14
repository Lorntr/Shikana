const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');
const { getUserData } = require('../../databaseFunctions');

const ROLE_STATUS_MAP = {
    "1445422277444370543": "Главный Администратор", 
    "1443942338345963601": "Администратор", 
    "1443933606442700871": "Сотрудник FIA", 
    "1443943869439021090": "Пилот",
};

function determineAllUserStatuses(member) {
    const foundStatuses = [];
    
    const userRoleIds = member.roles.cache.keys(); 

    for (const roleId of userRoleIds) {
        const status = ROLE_STATUS_MAP[roleId];
        if (status) {
            foundStatuses.push(status);
        }
    }

    if (foundStatuses.length === 0) {
        return ["Участник"];
    }

    return foundStatuses;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user_panel')
		.setDescription('Показывает ваши статистические данные с сервера.'),

	async execute(interaction) {
        if (!interaction.inGuild() || !interaction.member) {
            return interaction.reply({ content: 'Эта команда должна быть использована на сервере.', ephemeral: true });
        }
        
		const userId = interaction.user.id;
		const username = interaction.user.tag; 
        const member = interaction.member; 

		const userStatuses = determineAllUserStatuses(member);
        const statusDisplay = userStatuses.join(', '); 
        const userData = getUserData(userId);
        
        
        let panelEmbed;
        let userDataFound = true;

        if (!userData) {
            userDataFound = false;
			panelEmbed = new EmbedBuilder()
				.setColor(0xFF0000)
				.setTitle(`❌ Панель статистики: ${username}`)
				.setDescription(`Ваших данных (очки) пока нет в базе. Ваши текущие статусы: **${statusDisplay}**.`);
		} else {
            panelEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`📊 Панель статистики: ${username}`)
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields(
                    { 
                        name: '👤 Статусы', 
                        value: `**${statusDisplay}**`, 
                        inline: false 
                    },
                    { 
                        name: '🏆 Очки чемпионата', 
                        value: `**${userData.championshipPoints}**`,
                        inline: true 
                    },
                    { 
                        name: '⚠️ Штрафные очки', 
                        value: `**${userData.penaltyPoints}**`,
                        inline: true 
                    }
                )
                .setTimestamp()
                .setFooter({ text: 'Статусы определяются ролями, очки из БД' });
        }

        const reportButton = new ButtonBuilder()
            .setCustomId('report_incident_button')
            .setLabel('Сообщить об инциденте')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
            .addComponents(reportButton);

		await interaction.reply({ 
            embeds: [panelEmbed], 
            components: [row],
            ephemeral: true
        });
	},
};