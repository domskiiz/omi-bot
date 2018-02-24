const { RtmClient, CLIENT_EVENTS, RTM_EVENTS, WebClient } = require('@slack/client');

const express   = require('express');
const mongoose  = require('mongoose');

const app       = express();

const web       = new WebClient(process.env.SLACK_BOT_TOKEN);
var rtm         = new RtmClient(process.env.SLACK_BOT_TOKEN);

var Quote       = require('./models.js');

rtm.start();

mongoose.connect(process.env.MONGODB_URI);


let channelList = [];
const appData = {};

let channelListPromise = web.channels.list();

// Client emits an RTM.AUTHENTICATED event when the connection data is avaiable
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  appData.selfId = rtmStartData.self.id;
  console.log(`Logged in as ${appData.selfId} of team ${rtmStartData.team.id}`);
});

// Client emits RTM.RTM_CONNECTION_OPENED when the connection is made
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function() {
  channelListPromise.then((response) => {
    response.channels.forEach((channel) => {
      if (channel.is_member) {
        channelList.push(channel.id);
        rtm.sendMessage(process.env.GREETING_MESSAGE, channel.id)
          .then(() => console.log(`Message sent to channel ${channel.name}`))
          .catch(console.error);
      }
    });
  });
  console.log('Cockbot is authenticated.');
});

// Listen for messages
rtm.on(RTM_EVENTS.MESSAGE, (message) => {
  // Skip messages that are from a bot or my own user ID
  if ( (message.subtype && message.subtype === 'bot_message') ||
       (!message.subtype && message.user === appData.selfId) ) {
    return;
  }

  // If bot is mentioned
  if (message.text.includes("<@U9DRYV29Z>")) {
    var quote, author;
    Quote.count().exec(function (err, count) {
      // Get a random entry
      var random = Math.floor(Math.random() * count)
      Quote.findOne().skip(random).exec(
        function (err, result) {
          quote = result.quote;
          author = result.author;
          rtm.sendMessage(`${quote} -${author}`, message.channel)
            .then(() => console.log(`Message sent to channel ${message.channel}`))
            .catch(console.error);
      });
    });
  }

  // see if bot was added to new channel
  if (message.subtype === 'channel_join' && message.user === 'U9DRYV29Z') {
    channelList.push(message.channel);
    console.log(channelList);
  }


});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Bot listening on port ${port}!`);
});
