const { 
    Events, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionsBitField ,
    MessageFlags
} = require('discord.js');

const INCIDENT_CHANNEL_ID = '1449157464443322430'; 

const MODERATOR_ROLES = [
    '1445422277444370543',
    '1443933606442700871'
];

module.exports = {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction) {
        
        if (interaction.isButton() && interaction.customId === 'report_incident_button') {
            
            const modal = new ModalBuilder()
                .setCustomId('incident_report_modal')
                .setTitle('Подача отчета об инциденте');

            const culpritNickname = new TextInputBuilder()
                .setCustomId('culprit_nickname')
                .setLabel('Никнеймы участник инцидента(в том числе свой)')
                .setPlaceholder('Lornt, EmpoKala')
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            const incidentDetails = new TextInputBuilder()
                .setCustomId('incident_details')
                .setLabel('Суть подачи инцидента')
                .setPlaceholder('Опишите, что произошло и какое наказание хотите увидеть')
                .setRequired(true)
                .setStyle(TextInputStyle.Paragraph);

            const evidenceLink = new TextInputBuilder()
                .setCustomId('evidence_link')
                .setLabel('Доказательства (Ссылка на видео)')
                .setPlaceholder('https://youtube.com и др.')
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            modal.addComponents(
                new ActionRowBuilder().addComponents(culpritNickname),
                new ActionRowBuilder().addComponents(incidentDetails),
                new ActionRowBuilder().addComponents(evidenceLink)
            );

            await interaction.showModal(modal);
            return;
        }

        if (interaction.isModalSubmit() && interaction.customId === 'incident_report_modal') {
            
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const culprit = interaction.fields.getTextInputValue('culprit_nickname');
            const details = interaction.fields.getTextInputValue('incident_details');
            const evidence = interaction.fields.getTextInputValue('evidence_link');

            const reportEmbed = new EmbedBuilder()
                .setColor(0xFFFF00)
                .setTitle('ИНЦИДЕНТ')
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(`Статус: **Ожидает рассмотрения**`)
                .addFields(
                    { name: 'Участники инцидента', value: culprit, inline: true },
                    { name: 'Суть инцидента', value: details },
                    { name: 'Доказательства', value: evidence }
                )
                .setTimestamp();

            const reviewedButton = new ButtonBuilder()
                .setCustomId('report_reviewed')
                .setLabel('✅ Рассмотрено')
                .setStyle(ButtonStyle.Success);

            const racingIncidentButton = new ButtonBuilder()
                .setCustomId('report_racing_incident')
                .setLabel('🏁 Признать гоночным инцидентом')
                .setStyle(ButtonStyle.Primary);

            const moderatorRow = new ActionRowBuilder()
                .addComponents(reviewedButton, racingIncidentButton);
            
            const channel = interaction.client.channels.cache.get(INCIDENT_CHANNEL_ID);

            if (!channel) {
                await interaction.editReply({ content: '❌ Ошибка: Не могу найти канал для отчетов. Обратитесь к администратору.', flags: 64 });
                return;
            }
            
            const sentMessage = await channel.send({ embeds: [reportEmbed], components: [moderatorRow] });
            
            const threadName = `Обсуждение инцидента от ${culprit}`;

            try {
                const thread = await sentMessage.startThread({
                    name: threadName,
                    autoArchiveDuration: 1440,
                    reason: 'Создание ветки для обсуждения отчета об инциденте',
                });
    

                await thread.send(`Эта ветка создана ТОЛЬКО ДЛЯ ОБСУЖДЕНИЯ ИНЦИДЕНТА. Писать сюда могут ТОЛЬКО его участники.`);
    
                console.log(`Создана ветка: ${thread.name} в канале ${channel.name}`);

            } catch (e) {
                console.error(`Ошибка при создании ветки для инцидента ${sentMessage.id}:`, e);
            }


await interaction.editReply({ content: '✅ Ваш отчет успешно отправлен в канал модерации и создана ветка для обсуждения!', flags: 64 });
return;
        }

        if (interaction.isButton() && ['report_reviewed', 'report_racing_incident'].includes(interaction.customId)) {
            
            const memberRoleIds = Array.from(interaction.member.roles.cache.keys());
            const isModerator = MODERATOR_ROLES.some(roleId => memberRoleIds.includes(roleId));

            if (!isModerator) {
                return interaction.reply({ content: '❌ У вас нет прав для использования этой кнопки.', ephemeral: true });
            }

            await interaction.deferUpdate();

            const originalEmbed = interaction.message.embeds[0];
            const newEmbed = EmbedBuilder.from(originalEmbed);
            let resultText;
            
            
            if (interaction.customId === 'report_reviewed') {
                resultText = 'Нарушение подтверждено. Вердикт находится в канале:\n<#1448771956236222646>.';
                newEmbed.setColor(0x00FF00);

            } else if (interaction.customId === 'report_racing_incident') {
                resultText = 'Случай признан гоночным инцидентом. Нарушений не выявлено.';
                newEmbed.setColor(0xAA00AA);
            } else {
                return interaction.followUp({ content: 'Неизвестное действие.', ephemeral: true });
            }

            newEmbed
                .setDescription(`Статус: **${resultText}**`)
                .setFooter({ text: `Обработал: ${interaction.user.tag}` });
            
            await interaction.editReply({ 
                embeds: [newEmbed], 
                components: []
            });

            const thread = interaction.message.thread;
            
            if (thread) {
                try {
                    await thread.setArchived(true, `Инцидент закрыт модератором: ${interaction.customId}`);
                    console.log(`Ветка ${thread.name} успешно закрыта.`);
                    
                    
                } catch (e) {
                    console.error(`Ошибка при закрытии ветки ${thread.name}:`, e);
                    await interaction.followUp({ content: '⚠️ Ветка не была закрыта автоматически. Проверьте права бота.', flags: 64 });
                }
            } else {
                console.log('Ветка не найдена для этого сообщения.');
            }

            return;
        
        }

        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: 'There was an error while executing this command!',
                        ephemeral: true,
                    });
                } else {
                    await interaction.reply({
                        content: 'There was an error while executing this command!',
                        ephemeral: true,
                    });
                }
            }
        }
	},
};