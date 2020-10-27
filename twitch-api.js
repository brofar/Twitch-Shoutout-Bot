const Dotenv = require('dotenv').config();
const axios = require('axios');

/**
 * Twitch Helix API helper ("New Twitch API").
 */
class TwitchApi {
  static get requestOptions() {
    // Automatically remove "oauth:" prefix if it's present
    const oauthPrefix = "oauth:";
    let oauthBearer = this.accessToken;
    if (oauthBearer.startsWith(oauthPrefix)) {
      oauthBearer = oauthBearer.substr(oauthPrefix.length);
    }
    // Construct default request options
    return {
      baseURL: "https://api.twitch.tv/helix/",
      headers: {
        "Client-ID": process.env.BOT_CLIENT_ID,
        "Authorization": `Bearer ${oauthBearer}`
      }
    };
  }

  static get accessToken() {
    return this.access_token || null;
  }

  static validateToken() {
    return new Promise((resolve, reject) => {
      console.log('[TwitchApi]', 'Validating Twitch access token.');
      axios.get(`https://id.twitch.tv/oauth2/validate`, {
        headers: {
          "Authorization": `Bearer ${this.accessToken}`
        }
      })
        .then((res) => {
          console.log('[TwitchApi]', 'Twitch access token is valid.');
          resolve(this.access_token);
        })
        .catch((err) => {
          console.log('[TwitchApi]', 'Twitch access token is invalid.');
          this.getToken()
            .then((token) => {
              this.access_token = token;
              resolve(token);
            })
            .catch((err) => {
              this.handleApiError(err);
              reject(err);
            });
        });
    });
  }

  static getToken() {
    return new Promise((resolve, reject) => {
      let client_id = process.env.BOT_CLIENT_ID;
      let client_sec = process.env.BOT_CLIENT_SECRET;

      console.log('[TwitchApi]', `Generating Twitch access token.`);

      axios.post(`https://id.twitch.tv/oauth2/token?client_id=${client_id}&client_secret=${client_sec}&grant_type=client_credentials`)
        .then((res) => {
          resolve(res.data.access_token || null);
        })
        .catch((err) => {
          this.handleApiError(err);
          reject(err);
        });
    });
  }

  static fetchStream(channelName) {
    return new Promise((resolve, reject) => {
      this.validateToken()
        .then((authkey) => {
          console.log('[TwitchApi]', `Fetching stream for @${channelName}.`);
          axios.get(`/streams?user_login=${channelName}`, this.requestOptions)
            .then((res) => {
              resolve(res.data.data || []);
            })
            .catch((err) => {
              this.handleApiError(err);
              reject(err);
            });
        })
        .catch((err) => {
          this.handleApiError(err);
          reject(err);
        });
    });
  }

  static handleApiError(err) {
    const res = err.response || {};

    if (res.data && res.data.message) {
      console.error('[TwitchApi]', 'API request failed with Helix error:', res.data.message, `(${res.data.error}/${res.data.status})`);
    } else {
      console.error('[TwitchApi]', 'API request failed with error:', err.message || err);
    }
  }
}

module.exports = TwitchApi;