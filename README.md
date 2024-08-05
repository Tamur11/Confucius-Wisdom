# Confucius Wisdom Bot

Confucius Wisdom Bot is a Discord bot that shares random pieces of wisdom from pinned messages in your Discord server. The bot fetches all pinned messages from all text channels in all guilds it is part of and sends a random pinned message to a specified channel at scheduled times or upon user request.

## Features

- Fetches all pinned messages from all text channels in all guilds.
- Sends a random pinned message to a specified channel at midnight and noon every day.
- Responds to specific user commands to share wisdom or provide information about the number of pins.

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/Tamur11/Confucius-Wisdom.git
   cd confucius-wisdom
   ```

2. Install the dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory and add your Discord bot token and the channel ID where you want the bot to send messages:

   ```
   DISCORD_TOKEN=your_discord_token
   CHANNEL_ID=your_channel_id
   ```

4. Start the bot:
   ```sh
   npm start
   ```

## Usage

Once the bot is running, it will automatically fetch all pinned messages and schedule tasks to send a random pinned message to the specified channel at midnight and noon every day.

### Commands

- `confucius bestow upon me your wisdom`: The bot will send a random pinned message to the channel where the command was issued.
- `confucius how big is your brain`: The bot will respond with the number of pinned messages it has fetched.

## Development

To start the bot in development mode with automatic restarts on file changes, use:

```sh
npm run dev
```
