const Dotenv = require('dotenv').config();
const TwitchApi = require('./twitch-api');
const moment = require('moment');

// Refresh command
// Variable for stream's last start
// Polling timer

class TwitchMonitor {
  static init() {
    console.log(`[TwitchMonitor]`, `TwitchMonitor class instantiated.`);
    this.started_at = null;

    let checkInterval = 10 * 60 * 1000;

    // Periodic Refresh
    setInterval(() => {
      this.refresh("Periodic refresh");
    }, checkInterval + 1000);

    // Immediate refresh after startup
    setTimeout(() => {
      this.refresh("Initial refresh after start-up");
    }, 1000);
  }

  static get startedAt() {
    return this.started_at;
  }

  static get isLive() {
    return this.is_live;
  }

  static refresh(reason) {
    console.log('[TwitchMonitor]', `Refreshing now (${reason ? reason : "No reason"})`);

    // Refresh stream info
    TwitchApi.fetchStream(process.env.CHANNEL_NAME)
      .then((channels) => {
        this.handleStreamList(channels);
      })
      .catch((err) => {
        console.warn('[TwitchMonitor]', 'Error in streams refresh:', err);
      });

  }

  static handleStreamList(stream) {
    stream = stream[0];
    this.started_at = null;
    this.is_live = false;
    if(stream && stream.type === "live") {
      this.started_at = stream.started_at;
      this.is_live = true;
    }
    
    console.log('[TwitchMonitor]', `Stream live: ${this.is_live}. ${this.started_at ? `Started at ${this.started_at}.` : ""}`);
  }
}

module.exports = TwitchMonitor;