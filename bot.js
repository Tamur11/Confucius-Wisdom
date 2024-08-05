const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { config } = require("dotenv");
const cron = require("node-cron");

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let allPins = new Collection();

// Fetch all pins from all text channels in all guilds
async function getPins() {
  console.log("Attempting to retrieve all pins.");
  allPins.clear();

  for (const guild of client.guilds.cache.values()) {
    for (const channel of guild.channels.cache.values()) {
      if (channel.isTextBased()) {
        try {
          const pins = await channel.messages.fetchPinned();
          pins.forEach((pin) => allPins.set(pin.id, pin));
        } catch (error) {
          console.error(
            `Failed to retrieve pins from ${channel.name}: ${error}`
          );
        }
      }
    }
  }
  console.log("Successfully retrieved all pins.");
}

// When the bot is ready
client.once("ready", async () => {
  await getPins();

  // Schedule tasks for midnight and noon
  cron.schedule("0 0 * * *", () => bestowWisdom(process.env.CHANNEL_ID), {
    timezone: "Asia/Shanghai",
  });

  console.log("Bot is ready and scheduled tasks are set.");
});

// Send a random pinned message to the channel
async function bestowWisdom(channelId) {
  const channel = await client.channels.fetch(channelId);
  if (allPins.size === 0) {
    await getPins();
  }
  const randomPin = allPins.random();
  if (!randomPin) return;

  // If strict, we replace the word directly regardless of text before or after
  // If not strict, there needs to be a word boundary before or after,
  // since short words like "sha" may be contained within other words
  const wordReplacements = {
    shaheen: {
      replacement: "sora",
      strict: true,
    },
    sha: {
      replacement: "sora",
      strict: false,
    },
  };

  let messageToSend = randomPin.content ? `"${randomPin.content}"` : "";

  for (const [key, value] of Object.entries(wordReplacements)) {
    if (value.strict) {
      const regex = new RegExp(key, "gi");
      messageToSend = messageToSend.replace(regex, value.replacement);
    } else {
      const regex = new RegExp(`\\b${key}\\b`, "gi");
      messageToSend = messageToSend.replace(regex, value.replacement);
    }
  }

  let messageContent = `Confucius say: ${messageToSend}\n${randomPin.url}`;

  const messageOptions = {
    content: messageContent,
    files:
      randomPin.attachments.size > 0
        ? [...randomPin.attachments.values()].map(
            (attachment) => attachment.url
          )
        : [],
  };

  await channel.send(messageOptions);
}

// Handle messages for specific commands
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (
    message.content.toLowerCase() === "confucius bestow upon me your wisdom"
  ) {
    await bestowWisdom(message.channel.id);
  } else if (
    message.content.toLowerCase() === "confucius how big is your brain"
  ) {
    await message.channel.send(`As large as ${allPins.size} pins.`);
  }
});

// Update pins whenever a new pin is added
client.on("channelPinsUpdate", async (channel, time) => {
  await getPins();
});

client.login(process.env.DISCORD_TOKEN);
