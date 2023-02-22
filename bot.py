import datetime
import discord
import os
import random
from discord.ext import tasks
from dotenv import load_dotenv
from zoneinfo import ZoneInfo

load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')
CHANNEL_ID = 1037366923324838008

intents = discord.Intents.default()
intents.message_content = True

client = discord.Client(intents=intents)

midnight_time = datetime.time(hour=0, minute=0, second=0, tzinfo=ZoneInfo("Asia/Shanghai"))
noon_time = datetime.time(hour=24, minute=0, second=0, tzinfo=ZoneInfo("Asia/Shanghai"))

all_pins = []


# get all pins
async def get_pins():
    print("Attempting to retrieve all pins.")

    all_channels = []
    for guild in client.guilds:
        for channel in guild.text_channels:
            all_channels.append(channel)

    for channel in all_channels:
        all_pins.extend(await channel.pins())

    print("Successfully retrieved all pins.")


@client.event
async def on_ready():
    await get_pins()

    # start daily wisdom on ready
    if not midnight_wisdom.is_running():
        midnight_wisdom.start()
        print("Midnight wisdom task started.")
    if not noon_wisdom.is_running():
        noon_wisdom.start()
        print("Noon wisdom task started.")


async def bestow_wisdom(channel):
    response = random.choice(all_pins)
    content_format = ""
    if response.content:
        content_format = ' "' + response.content + '"'
    content_format.replace('@', '@ ')
    await channel.send('Confucius say: ' + content_format, files=[await f.to_file() for f in response.attachments])
    await channel.send(response.jump_url)


# on message commands
@client.event
async def on_message(message):
    if message.author == client.user:
        return

    if message.content.lower() == 'confucius bestow upon me your wisdom':
        await bestow_wisdom(message.channel)

    elif message.content.lower() == 'confucius how big is your brain':
        await message.channel.send('As large as ' + str(len(all_pins)) + ' pins.')


# midnight wisdom
@tasks.loop(time=midnight_time)
async def midnight_wisdom():
    print("Attempting to send midnight wisdom.")
    channel = client.get_channel(1037366923324838008)

    await bestow_wisdom(channel)

    print("Midnight wisdom sent.")


# noon wisdom
@tasks.loop(time=noon_time)
async def noon_wisdom():
    print("Attempting to send noon wisdom.")
    channel = client.get_channel(1037366923324838008)

    await bestow_wisdom(channel)

    print("Noon wisdom sent.")


# pin updates
@client.event
async def on_guild_channel_pins_update(channel, last_pin):
    await get_pins()


@client.event
async def on_guild_channel_pins_update(channel, last_pin):
    await get_pins()


client.run(TOKEN)
