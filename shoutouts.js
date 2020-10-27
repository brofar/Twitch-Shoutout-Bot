const MiniDb = require('./minidb');
const moment = require('moment');

class ShoutOuts {
    static init() {
        console.log(`[Shoutouts]`, `Shoutout class instantiated.`);
        this._userDb = new MiniDb("twitch-users");
        this._watchData = this._userDb.get("watch-list") || { };
        this._shoutouts = this._userDb.get("shout-outs") || { };
    }

    static inList(username) {
      let watchedUsers = this._watchData['usernames'] || [ ];

      return (watchedUsers.indexOf(username) >= 0);
    }

    // See if a user was already shouted out this stream
    // by using the stream's start time as the discriminator
    // then update the object
    static shouldShoutOut(username, started_at) {
      username = username.trim().toLowerCase();

      //console.log('[ShoutOuts]', `Checking shout out timing for @${username}`);
      // Don't shout out people not on the list
      if (!this.inList(username)) return false;

      let now = moment();
      let startedAt = moment(started_at);
      let shouts = this._shoutouts;
      let shouldShout = false;

      // Has it been the right amount of time since
      // stream has started
      let waitTime = process.env.MIN_TO_WAIT_BEFORE_SHOUTOUT;
      let streamUptime = moment().diff(started_at, 'minutes');
      let rightTime = (streamUptime > waitTime) || false;

      //console.log('[ShoutOuts]', `Stream uptime: ${streamUptime}; Wait time: ${waitTime}`);

      if(rightTime) {
        // Check last shout out vs this stream's start time
        // Either add them to the list or update their record
        let existingHistory = shouts[username] || null;

        if (existingHistory) { //has had a shoutout before.
          // Check against the last start time
          let lastShout = moment(existingHistory);
          shouldShout = !lastShout.isSame(startedAt);
          shouts[username] = startedAt;
        } else { //has NOT had a shoutout before.
          // Add them to the list
          shouts[username] = startedAt;
          shouldShout = true;
        }
        this._userDb.put('shout-outs', shouts);
      }
      return shouldShout;
    }
}

module.exports = ShoutOuts;