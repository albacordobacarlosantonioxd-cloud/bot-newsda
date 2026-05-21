import { fileURLToPath } from 'url';
import path from 'path';

// Configuraciones principales
global.botNumber = "5214991213571"; 
global.owner = [
  ['5214991213571', 'Charly Developer', true]
];
global.sessionName = "./Sessions/Owner";
global.prefix = "/";

// Base de datos simple
global.db = {
    users: {},
    chats: {}, // Agregado para evitar errores en main.js
    stats: { totalCommands: 0 }, // Agregado para las stats
    settings: {}
};

global.loadDatabase = async () => {
    console.log("[-] Base de datos inicializada.");
};

// Manejo de rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export { __filename, __dirname };
