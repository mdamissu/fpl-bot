const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const mongoose = require("mongoose");
const notifyService = require('./services/notifyService'); 
const { token, mongoURL } = require('./config.json');
const {
    buildAllRankCache
} = require("./services/chartService");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
client.cooldowns = new Collection();

const dbConnect = async () => {
    try {
        await mongoose.connect(mongoURL);
        console.log("✅ Connected to MongoDB");
    }
    catch (err) {
        console.error("❌ Mongo error:", err);
        process.exit(1);
    }
};

const loadCommands = () => {
    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        if (!fs.statSync(commandsPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            }
            else {
                console.log(`[WARNING] ${filePath} missing data or execute`);
            }
        }
    }
};

const loadEvents = () => {
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, async (...args) => {
                try {
                    await event.execute(...args);
                }
                catch (err) {
                    console.error("Event error:", err);
                }
            });
        }
    }
};

async function main() {
    await dbConnect();
    loadCommands();
    loadEvents();
    buildAllRankCache();                  // build lần đầu
    setInterval(buildAllRankCache, 30 * 60 * 1000); // 30 phút rebuild
    setInterval(() => {
        notifyService(client);
    }, 60 * 1000);
    client.login(token);
}

main();
