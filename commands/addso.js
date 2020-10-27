const MiniDb = require('../minidb');

class AddSo {
  static execute(client, channel, message, args) {

    this._userDb = new MiniDb("twitch-users");
    this._userData = this._userDb.get("watch-list") || {};

    let watchedUsers = this._userData['usernames'] || [];

    // Loop through all arguments for users to add to the list
    let user = args[0];
    let userToAdd = user.toString().trim().toLowerCase();
    let confirmationMessage;

    // Remove the '@' symbol if it exists.
    if (userToAdd.charAt(0) === '@') {
      userToAdd = userToAdd.substring(1);
    }

    // Whitespace or blank message
    if (!userToAdd.length) return;

    // If they're not already on the list, add them
    if (watchedUsers.indexOf(userToAdd) === -1) {
      watchedUsers.push(userToAdd);
      this._userData['usernames'] = watchedUsers;
      this._userDb.put("watch-list", this._userData);
      confirmationMessage = `@${userToAdd} added to the automatic shout out list.`;
    } else {
      confirmationMessage = `@${userToAdd} is already on the automatic shout out list.`;
    }

    if (confirmationMessage) {
      client.say(channel, confirmationMessage)
        .then(() => {
          console.log('[AddSo]', `@${userToAdd} added.`);
        })
        .catch((err) => {
          console.log('[AddSo]', `Couldn't add @${userToAdd}.`, err.message);
        });
    }
  }
}

module.exports = AddSo;