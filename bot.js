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
            `Failed to retrieve pins from ${channel.name}: ${error.message}`
          );
        }
      }
    }
  }
  console.log("Successfully retrieved all pins.");
}

// When the bot is ready
client.once("ready", async () => {
  try {
    await getPins();

    // Schedule tasks for midnight and noon
    cron.schedule("0 0 * * *", () => bestowWisdom(process.env.CHANNEL_ID), {
      timezone: "Asia/Shanghai",
    });

    console.log("Bot is ready and scheduled tasks are set.");
  } catch (error) {
    console.error("Error during bot initialization:", error.message);
  }
});

// Send a random pinned message to the channel
async function bestowWisdom(channelId) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      console.error(`Channel with ID ${channelId} not found.`);
      return;
    }

    if (allPins.size === 0) {
      await getPins();
    }

    const randomPin = allPins.random();
    if (!randomPin) {
      console.log("No pinned messages available to send.");
      return;
    }

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
    console.log("Successfully sent wisdom to channel.");
  } catch (error) {
    if (error.code === 50013) {
      console.error(
        `Missing permissions to send message to channel ${channelId}. Error: ${error.message}`
      );
    } else if (error.code === 50001) {
      console.error(
        `Channel ${channelId} not found or bot doesn't have access. Error: ${error.message}`
      );
    } else if (error.code === 50005) {
      console.error(
        `Cannot send empty message to channel ${channelId}. Error: ${error.message}`
      );
    } else {
      console.error(
        `Error sending wisdom to channel ${channelId}: ${error.message}`
      );
    }
  }
}

// Handle messages for specific commands
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  try {
    if (
      message.content.toLowerCase() === "confucius bestow upon me your wisdom"
    ) {
      await bestowWisdom(message.channel.id);
    } else if (
      message.content.toLowerCase() === "confucius how big is your brain"
    ) {
      await message.channel.send(`As large as ${allPins.size} pins.`);
    }
  } catch (error) {
    console.error(`Error handling message command: ${error.message}`);
    try {
      await message.channel.send(
        "I apologize, but I encountered an error while processing your request."
      );
    } catch (sendError) {
      console.error(`Failed to send error message: ${sendError.message}`);
    }
  }
});

// Update pins whenever a new pin is added
client.on("channelPinsUpdate", async (channel, time) => {
  try {
    await getPins();
  } catch (error) {
    console.error(`Error updating pins: ${error.message}`);
  }
});

// Handle client errors
client.on("error", (error) => {
  console.error("Discord client error:", error.message);
});

// Handle process errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error.message);
  console.error("Stack trace:", error.stack);
});

client.login(process.env.DISCORD_TOKEN);
