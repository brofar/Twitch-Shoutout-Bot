const Dotenv = require('dotenv').config();
const tmi = require("tmi.js");
const moment = require('moment');
const ShoutOuts = require('./shoutouts');
const TwitchApi = require('./twitch-api');
const TwitchMonitor = require('./twitch-monitor');
const fs = require("fs");

// --- Startup -------------------------------------------
console.log('Bot starting.');

// --- Twitch Commands -----------------------------------
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

console.log(`[Twitch]`, `Discovered ${commandFiles.length} command file(s).`);

var commands = new Object();

// grab all the command files from the command directory & store in object
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  var cmdName = command.name.toString().trim().toLowerCase();

  commands[cmdName] = command;
  console.log(`[Twitch]`, `Added ${cmdName} to active command list.`);
}

console.log(`[Twitch]`, `Finished loading commands.`);

// --- Twitch --------------------------------------------
console.log(`[Twitch]`, `Connecting to Twitch...`);

// Define bot configuration options
const opts = {
  options: { debug: false },
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.BOT_OAUTH_TOKEN
  },
  channels: [process.env.CHANNEL_NAME]
};

// Create a Twitch chat client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on("message", async (channel, context, msg, self) => {
  // Ignore messages from the bot
  if (self) return;

  let prefix = process.env.TWITCH_PREFIX;
  let user = context.username.toLowerCase();

  //console.log('[TEMP]', `${user}: ${msg}`);

  // Remove whitespace from chat message
  var commandName = msg.trim().toLowerCase();

  // Bot Commands
  if (msg.startsWith(prefix) && isMod(context)) {
    var args = msg.slice(prefix.length).trim().split(/ +/);
    var command = args.shift().toLowerCase();

    if (!commands.hasOwnProperty(command)) return;

    console.log('[Twitch]', `Received command ${command} from ${user}`);

    // Run the actual command
    try {
      commands[command].execute(client, channel, msg, args);
    } catch (e) {
      console.warn('[Twitch]', 'Command execution problem:', e);
      client.say(channel, `There was an error trying to execute that command.`);
    }
  }
  let started_at = TwitchMonitor.startedAt;
  let is_live = TwitchMonitor.isLive;
  if (is_live && ShoutOuts.shouldShoutOut(user, started_at)) {
    //console.log('[TEMP]', `!so @${user}`);
    client.say(channel, `!so @${user}`)
      .then(() => {
        console.log('[Twitch]', `Shout Out command sent for @${user}.`);
      })
      .catch((err) => {
        console.log('[AddSo]', `Couldn't shout out @${user}.`, err.message);
      });
  }
});

// Connect to Twitch:
console.log(`[Twitch]`, `Logging in to Twitch...`);
client.connect();
TwitchMonitor.init();
ShoutOuts.init();


function isMod(context) {
  // Use badges to determine whether the user is a mod/broadcaster
  // without needing to pull the user object. The mod/broadcaster
  // badge will be in slot 1 (of a possible 3) of the user's badges.
  var badge1 = '';

  if (Object.keys(context.badges).length > 0)
    badge1 = Object.keys(context.badges)[0];

  let isMod = (badge1 === 'moderator');
  let isBroadcaster = (badge1 === 'broadcaster');
  let isModUp = isMod || isBroadcaster;

  return isModUp;
}