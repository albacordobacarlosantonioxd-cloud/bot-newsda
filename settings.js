import { fileURLToPath } from 'url';
import path from 'path';

global.botNumber = process.env.BOT_NUMBER || '';
global.owner = process.env.BOT_OWNER ? [process.env.BOT_OWNER] : [];
global.sessionName = process.env.SESSION_NAME || './Sessions/Owner';
global.githubUser = 'albacordobacarlosantonioxd-cloud';
global.githubUrl = 'https://github.com/albacordobacarlosantonioxd-cloud';
global.githubRepoUrl = 'https://github.com/albacordobacarlosantonioxd-cloud/bot-newsda';
global.apiUrl = 'https://api.evogb.org';
global.prefixes = ['.', '/', ',', '#'];
global.prefix = global.prefixes[0];
global.db = { users: {}, chats: {}, stats: { totalCommands: 0 }, settings: {} };
global.loadDatabase = async () => {
    console.log('[-] Base de datos inicializada.');
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export { __filename, __dirname };
