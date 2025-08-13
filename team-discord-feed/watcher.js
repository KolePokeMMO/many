const fs = require('fs');
const path = require('path');

// List of files to watch
const filesToWatch = [
  '../docs/assets/data/discord-feeds/discord-announcements.json',
  '../docs/assets/data/discord-feeds/discord-bounty-board.json',
  '../docs/assets/data/discord-feeds/discord-callouts.json',
  '../docs/assets/data/discord-feeds/discord-giveaways.json',
  '../docs/assets/data/discord-feeds/discord-shiny-flex.json',
  '../docs/assets/data/discord-feeds/discord-team-events.json',
  '../docs/assets/data/discord-feeds/discord-team-shunts.json'
];

filesToWatch.forEach(relPath => {
  const watchPath = path.join(__dirname, relPath);
  fs.watchFile(watchPath, { interval: 300000 }, (curr, prev) => { // 5 minutes
    console.log(`⚠️ File changed: ${relPath} at ${new Date().toISOString()}`);
  });
});
