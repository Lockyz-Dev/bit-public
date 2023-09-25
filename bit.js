const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { token, botIDs } = require('./config.json');

if(!token) {
	console.log("Bit Core failed to start: Token is not defined.")
	process.exit(1)
}

if(!botIDs.client) {
	console.log("Bit Core failed to start: Client ID is not defined.")
	process.exit(1)
}

if(!botIDs.owner) {
	console.log("Owner ID is not defined, some bot functions will never work.")
}

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildEmojisAndStickers,
		
    ]
})
var thisSentence = false;

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
})

client.commands = new Collection();
client.plugins = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

if(commandsPath && commandFiles) {
	for(const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
	
		if('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
	console.log("Loading "+commandFiles.length+" commands")
} else {
	console.log('No commands found in Bit: Core.')
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

if(eventsPath && eventFiles) {
	for(const file of eventFiles) {
		const filePath = path.join(eventsPath, file);
		const event = require(filePath);
		if(event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		} else {
			client.on(event.name, (...args) => event.execute(...args));
		}
	}
	console.log("Loading "+eventFiles.length+" events")
} else {
	console.log('No event files found in Bit: Core')
}

const loggingPath = path.join(__dirname, 'logging');
const loggingFiles = fs.readdirSync(loggingPath).filter(file => file.endsWith('.js'));

if(loggingPath && loggingFiles) {
	for(const file of loggingFiles) {
		const filePath = path.join(loggingPath, file);
		const logs = require(filePath);
		if(logs.once) {
			client.once(logs.name, (...args) => logs.execute(...args));
		} else {
			client.on(logs.name, (...args) => logs.execute(...args));
		}
	}
	
	console.log("Loading "+loggingFiles.length+" logging functions")
}

const pluginPath = path.join(__dirname, 'plugins');
const plugins = fs.readdirSync(pluginPath)
//const pluginFiles = fs.readdirSync(pluginPath).filter(file => file.endsWith('.js'));

if(pluginPath && plugins) {
	for(const folder of plugins) {
		//const pluginInfo = fs.readdirSync(pluginPath).filter(file => file.name('plugin.js'));
		const pluginInfo = require(pluginPath+"/"+folder+"/plugin.json")
		console.log("Loading "+pluginInfo.name+" made by "+pluginInfo.developer)
		client.plugins.set(pluginInfo.name)
	
		if(pluginInfo.commands === "true") {
			const commandsPath = pluginPath+"/"+folder+"/commands"
			const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	
			for(const file of commandFiles) {
				const filePath = path.join(commandsPath, file);
				const command = require(filePath);
	
				if('data' in command && 'execute' in command) {
					client.commands.set(command.data.name, command);
				} else {
					console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
				}
			}
			console.log("Loading "+commandFiles.length+" commands in the "+pluginInfo.name+" plugin")
		}
	
		if(pluginInfo.events === "true") {
			const eventsPath = pluginPath+"/"+folder+"/events"
			const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
	
			for(const file of eventFiles) {
				const filePath = path.join(eventsPath, file);
				const event = require(filePath);
				if(event.once) {
					client.once(event.name, (...args) => event.execute(...args));
				} else {
					client.on(event.name, (...args) => event.execute(...args));
				}
			}
			console.log("Loading "+eventFiles.length+" events in the "+pluginInfo.name+" plugin")
		}
	}
	console.log("Loading "+plugins.length+" plugins")
} else {
	console.log('No plugins found')
}

module.exports = {
	countPlugins: function countPlugins() {
		const pluginPath = "./plugins/";
		const plugins = fs.readdirSync(pluginPath)
		var pluginCount = plugins.length;

		return pluginCount;
	},

	listAllPlugins: function listAllPlugins() {
		var pluginList = []
		var pluginNum = 0

        const pluginPath = "./plugins/";
        const plugins = fs.readdirSync(pluginPath)
        var pluginCount = plugins.length

        if(pluginPath && plugins) {
	        for(const folder of plugins) {
		        const pluginInfo = require("./plugins/"+folder+"/plugin.json")
				pluginList.push({
					'name': pluginInfo.name,
					'developer': pluginInfo.developer,
					'version': pluginInfo.version,
					'support': pluginInfo.support,
					'hasEvents': pluginInfo.events,
					'hasCommands': pluginInfo.commands
				})
                pluginNum += 1;
            }

            if(pluginNum === pluginCount) {
				return pluginList;
            }
        }
	}
}

client.login(token);