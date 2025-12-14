const Database = require('better-sqlite3');
const db = new Database('main.db', { verbose: console.log });

function initializeDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            userId INTEGER PRIMARY KEY,
            discordId TEXT NOT NULL UNIQUE, 
            championshipPoints INTEGER,
			penaltyPoints INTEGER
        );
    `;
    db.exec(createTableQuery);
    console.log('База данных успешно инициализирована и таблица готова.');
}

initializeDatabase(); 

const insertOrReplaceUser = db.prepare(`
    INSERT OR REPLACE INTO users (discordId, championshipPoints, penaltyPoints)
    VALUES (@discordId, @championshipPoints, @penaltyPoints)
`);

function insertUserBulk(users) {
    const runTransaction = db.transaction((userObjects) => {
        for (const user of userObjects) {
            insertOrReplaceUser.run(user);
        }
    });

    try {
        runTransaction(users); 
    } catch (error) {
        console.error("Ошибка при выполнении транзакции массовой вставки:", error);
    }
}

function getUserData(discordId) {
    const stmt = db.prepare('SELECT championshipPoints, penaltyPoints FROM users WHERE discordId = ?');
    
    const userData = stmt.get(discordId);

    return userData;
}

module.exports = {
    db, 
    insertUserBulk, 
    getUserData
};