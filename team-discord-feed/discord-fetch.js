const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../docs/assets/data/discord-feeds/discord-announcements.json');

require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const CHANNELS = [
  { id: process.env.ANNOUNCEMENTS_CHANNEL_ID, file: 'discord-announcements.json' },
  { id: process.env.SHINY_FLEX_CHANNEL_ID, file: 'discord-shiny-flex.json' },
  { id: process.env.CALLOUTS_CHANNEL_ID, file: 'discord-callouts.json' },
  { id: process.env.BOUNTY_BOARD_CHANNEL_ID, file: 'discord-bounty-board.json' },
  { id: process.env.TEAM_SHUNTS_CHANNEL_ID, file: 'discord-team-shunts.json', isForum: true },
  { id: process.env.GIVEAWAYS_CHANNEL_ID, file: 'discord-giveaways.json' },
  { id: process.env.TEAM_EVENTS_CHANNEL_ID, file: 'discord-team-events.json' }
];

function parseDiscordMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // italics
    .replace(/```([\s\S]+?)```/g, '<pre><code>$1</code></pre>') // code block
    .replace(/`([^`]+)`/g, '<code>$1</code>') // inline code
    .replace(/https?:\/\/\S+/g, url => `<a href="${url}" target="_blank">${url}</a>`); // links
}

// Fetch messages from a normal text channel
async function fetchChannelMessages(channel, limit = 20) {
  const messages = await channel.messages.fetch({ limit });
  const messagesArray = Array.from(messages.values()).reverse();

  const data = [];
  for (const m of messagesArray) {
    // Only use member.displayName, no fallback to username
    const displayName = m.member?.displayName || 'Unknown Member';

    data.push({
      id: m.id,
      username: displayName,
      avatar: m.author.displayAvatarURL(),
      content: parseDiscordMarkdown(m.content),
      attachments: m.attachments.map(a => a.url),
      timestamp: m.createdAt
    });
  }

  return data;
}

// Fetch messages from a forum channel
async function fetchForumChannelMessages(forumChannel, limitPerThread = 20) {
  const activeThreads = await forumChannel.threads.fetchActive();
  const archivedThreads = await forumChannel.threads.fetchArchived();
  const allThreads = [...activeThreads.threads.values(), ...archivedThreads.threads.values()];

  let allMessages = [];

  for (const thread of allThreads) {
    const messages = await thread.messages.fetch({ limit: limitPerThread });
    const messagesArray = Array.from(messages.values()).reverse();

    for (const m of messagesArray) {
      const displayName = m.member?.displayName || 'Unknown Member';

      allMessages.push({
        id: m.id,
        username: displayName,
        avatar: m.author.displayAvatarURL(),
        content: parseDiscordMarkdown(m.content),
        attachments: m.attachments.map(a => a.url),
        timestamp: m.createdAt
      });
    }
  }

  allMessages.sort((a, b) => a.timestamp - b.timestamp);
  return allMessages;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    1024 // GuildMessageThreads
  ]
});

const outputFolder = path.join(__dirname, '../docs/assets/data/discord-feeds');
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

const FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function runFetchCycle() {
  console.log(`Fetch cycle started at ${new Date().toLocaleTimeString()}`);

  for (const ch of CHANNELS) {
    if (!ch.id) {
      console.warn(`⚠️ Channel ID missing for file ${ch.file}`);
      continue;
    }
    try {
      const channel = await client.channels.fetch(ch.id);
      let newData;
      if (ch.isForum && channel.type === ChannelType.GuildForum) {
        newData = await fetchForumChannelMessages(channel, 20);
      } else {
        newData = await fetchChannelMessages(channel, 20);
      }

      const outputPath = path.join(outputFolder, ch.file);
      let oldData = [];

      if (fs.existsSync(outputPath)) {
        const raw = fs.readFileSync(outputPath, 'utf8');
        oldData = JSON.parse(raw);
      }

      // Only write if data changed
      if (JSON.stringify(newData) !== JSON.stringify(oldData)) {
        fs.writeFileSync(outputPath, JSON.stringify(newData, null, 2));
        console.log(`💾 Updated ${ch.file} with ${newData.length} messages`);
      } else {
        console.log(`😴 No changes in ${ch.file}, skipping write`);
      }
    } catch (err) {
      console.error(`❌ Failed to fetch channel ${ch.id}:`, err);
    }
  }

  console.log(`Fetch cycle finished at ${new Date().toLocaleTimeString()}\n`);
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Run once immediately
  runFetchCycle();

  // Then every 5 minutes
  setInterval(runFetchCycle, FETCH_INTERVAL);
});

client.login(process.env.DISCORD_TOKEN);
