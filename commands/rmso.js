const MiniDb = require('../minidb');

class RmSo {
  static execute(client, channel, message, args) {

    this._userDb = new MiniDb("twitch-users");
    this._userData = this._userDb.get("watch-list") || {};

    let watchedUsers = this._userData['usernames'] || [];

    // Loop through all arguments for users to add to the list
    let user = args[0];
    let userToDel = user.toString().trim().toLowerCase();
    let confirmationMessage;

    // Remove the '@' symbol if it exists.
    if (userToDel.charAt(0) === '@') {
      userToDel = userToDel.substring(1);
    }

    // Whitespace or blank message
    if (!userToDel.length) return;

    // If they're on the list, delete them
    let deleteIndex = watchedUsers.indexOf(userToDel);
    if (deleteIndex !== -1) {
      watchedUsers.splice(deleteIndex, 1);
      this._userData['usernames'] = watchedUsers;
      this._userDb.put("watch-list", this._userData);
      confirmationMessage = `@${userToDel} removed from the automatic shout out list.`;
    } else {
      confirmationMessage = `@${userToDel} is not on the automatic shout out list.`;
    }

    if (confirmationMessage) {
      client.say(channel, confirmationMessage)
        .then(() => {
          console.log('[RmSo]', `@${userToDel} deleted.`);
        })
        .catch((err) => {
          console.log('[RmSo]', `Couldn't delete @${userToDel}.`, err.message);
        });
    }
  }
}

module.exports = RmSo;