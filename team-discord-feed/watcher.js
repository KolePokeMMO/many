const fs = require('fs');
const path = require('path');

const watchPath = path.join(__dirname, '../docs/assets/data/discord-feeds/discord-announcements.json');

fs.watchFile(watchPath, { interval: 100 }, (curr, prev) => {
  console.log(`⚠️ File changed at ${new Date().toISOString()}`);
  console.log(`Previous size: ${prev.size} bytes, New size: ${curr.size} bytes`);

  // Create an Error to capture stack trace, but filter to your code only
  const err = new Error('Stack trace for file write');
  
  // Clean stack trace to only your project files, so it’s easier to read
  const stackLines = err.stack.split('\n').filter(line => line.includes(__dirname));
  console.log(stackLines.join('\n'));
});
