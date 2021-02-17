const Dotenv = require('dotenv').config();
const tmi = require("tmi.js");
const moment = require('moment');
const ShoutOuts = require('./shoutouts');
const TwitchApi = require('./twitch-api');
const TwitchMonitor = require('./twitch-monitor');
const axios = require('axios');
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
// Define bot configuration options
const opts = {
  options: { debug: false },
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.BOT_OAUTH_TOKEN
  },
  channels: [process.env.CHANNEL_NAME],
  secure: true,
  reconnect: true
};

// Create a Twitch chat client with our options
const client = new tmi.client(opts);

// Command prefix
const prefix = process.env.TWITCH_PREFIX;

// Register our event handlers (defined below)

// Get chats (we don't care about whispers or action messages)
client.on("chat", async (channel, userstate, msg, self) => {
  // Ignore messages from the bot itself
  if (self) return;

  let user = userstate.username.toLowerCase();

  //console.log('[TEMP]', `${user}: ${msg}`);

  // Remove whitespace from chat message
  var commandName = msg.trim().toLowerCase();

  // Bot Commands
  if (msg.startsWith(prefix) && isMod(userstate)) {
    HandleCommand(commandName, channel, msg, args);
  }

  // Actual shout out stuff
  let started_at = TwitchMonitor.startedAt;
  let is_live = TwitchMonitor.isLive;
  if (is_live && ShoutOuts.shouldShoutOut(user, started_at)) {

    client.say(channel, `!so @${user}`)
      .then(() => {
        console.log('[Twitch]', `Shout Out command sent for @${user}.`);
      })
      .catch((err) => {
        console.log('[Twitch]', `Couldn't shout out @${user}.`, err.message);
      });
  }
});

client.on("disconnected", (reason) => {
  console.log(`[Twitch]`, `Disconnected. Reason: ${reason}`);
  connect();
});

// Functions

function connect() {
  console.log(`[Twitch]`, `Logging in to Twitch...`);
  client.connect()
  .then(() => {
    console.log(`[Twitch]`, `Connected.`);
  })
  .catch((err) => {
    console.log('[Twitch]', `Couldn't connect.`, err.message);
  });
}

function HandleCommand (command, channel, msg, args) {
  var args = msg.slice(prefix.length).trim().split(/ +/);
  var command = args.shift().toLowerCase();

  if (!commands.hasOwnProperty(command)) return;

  console.log('[Twitch]', `Received command ${command}.`);

  // Run the actual command
  try {
    commands[command].execute(client, channel, msg, args);
  } catch (e) {
    console.warn('[Twitch]', 'Command execution problem:', e);
    client.say(channel, `There was an error trying to execute that command.`);
  }
}

// Connect to Twitch:
connect();
TwitchMonitor.init();
ShoutOuts.init();

// Check if user is a mod or higher.
function isMod(userstate) {
  return userstate.mod || userstate.badges.broadcaster;
}