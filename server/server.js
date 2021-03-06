if (Meteor.isServer) {
//STARTUP

   console.log('Application starting');

  //Mongo Collections that store the users, messages and channels
  Messages = new Mongo.Collection("messages");
  Nicks = new Mongo.Collection("nicks");
  Channels = new Mongo.Collection("channels");

  QuotesDB = new Mongo.Collection("quotes");

  //var irc = Meteor.require('irc');
  var irc = Meteor.npmRequire("irc");
  var fs = Npm.require('fs');

  var isConnected = true;

  var currentNick = 'alfbot-2', currentServer = 'irc.synirc.net', currentChannel = '#testchannel';
  var client = ircAdd();

  //End of startup?


  
  //Adds a new IRC client if the user is logged in  
  function ircAdd() {

    if(isConnected == true) {
      var client = new irc.Client(currentServer, currentNick, {
          port: 6660,
          channels: [currentChannel],
          floodProtection: true,
          floodProtectionDelay: 1000,
          localAddress: null,
          debug: false,
          showErrors: false,
          autoRejoin: true,
          autoConnect: false,
          secure: false,
          selfSigned: false,
          certExpired: false,
          sasl: false,
          stripColors: false,
          channelPrefixes: "&#",
          messageSplit: 512,
          encoding: ''
      });

      //This allows the irc client to connect
      client.connect();

      clearDB();
      updateChannel(currentChannel);

      console.log('Connecting to ' + currentChannel);
      logMessage('Server', 'Connecting to ' + currentChannel);


      //~~~~~~~~~~~~~~~~~~~~~
      //Compile Options
      //~~~~~~~~~~~~~~~~~~~~~
      console.log('Starting Listeners');

      //catches errors that the client may throw
      client.addListener('error', Meteor.bindEnvironment (function(message) {
        console.log('error: ', message);
      }));

      //Listener adds the message of the day
      client.addListener('motd', Meteor.bindEnvironment(function (motd) {
        console.log('Message of the Day', motd);
      }));

      //Listener adds messages to the collection
      client.addListener('message', Meteor.bindEnvironment(function (from, to, message) {
        logMessage('> ' + from, message);

        //~~~~~~~~~~~~~~~~~~~~~
        //Commands
        //~~~~~~~~~~~~~~~~~~~~~
        if (/[^!]/.test(message)) {
          var command = /^!(\w+)/.exec(message);
          var userinput = /^!\w+\s+(.+)/.exec(message);
          var params = {
            command: command[1],
            channel: currentChannel,
            rawmessage: message,
            message: userinput[1],
            from: from,
            to: to
          };
          console.log('command found: ', command[1]);

          //Each command follows:
          if (command[1] == 'test') {
            Meteor.call('Fn_Addquote', params);
          }
        }

        //Always log all communications to file
        var writestream = fs.createWriteStream("./people.html");
        writestream.write(message);
      }));

      //Listerner adds pms to the collection
      client.addListener('pm', Meteor.bindEnvironment(function (nick, to, text, message) {
        logMessage('> ' + nick, message);
      }));

      client.addListener('notice', Meteor.bindEnvironment(function (nick, text, message) {
        if(nick == null) nick = 'Server';
        logMessage('> ' + nick, message);
      }));

      //Listener adds users to the collection
      client.addListener('names' + currentChannel, Meteor.bindEnvironment(function (nicks) {
        updateNicks(nicks);
      }));

      //Listener alerts user when a person joins the channel
      client.addListener('join' + currentChannel, Meteor.bindEnvironment(function (nick) {
        logMessage(nick, 'has joined the channel');
      }));

      //Listener alerts user when a person leaves the channel
      client.addListener('part' + currentChannel, Meteor.bindEnvironment(function (nick) {
        logMessage(nick, 'has left the channel');
      }));

      return client;
    }

    return null;
  }








  //This clears the mongo DBs
  function clearDB () {
    Messages.remove({});
    Nicks.remove({});
    Channels.remove({});

    Nicks.insert({nicks:""});
    Channels.insert({channel:""});
  }

  //Inserts a message into the collection
  function logMessage(from, message) {
    Messages.insert({
        from: from,
        message: message,
        time: Date.now()
    });
  }

  //Insert quote into quoteDB
  function savequote(para_from, para_message) {
    QuotesDB.insert({
        name: para_from,
        quote: para_message,
        year: year,
        added: Date.now()
    });
  }

  //This function chops up the message and extracts the command
  function commandResponse(message) {

    if((message.toLowerCase().indexOf(' ') > -1)) {
      var command = message.substr(1, message.indexOf(' ') - 1).toLowerCase();
    }

    else {
      var command = message.substr(1, message.length - 1).toLowerCase();
    }

    console.log(command + " end");

    var reply = '';

    //Sets the reply message for each command
    switch(command) {
      case 'command':
        reply = "the current command list has: /command, /help, /message, /kick";
        break;

      case 'help':
        reply = "click the help button in the navbar for additional help";
        break;

      case 'kick':
        reply = "this feature will allow an admin to remove users from the channel";
        break;

      case 'message': 
        reply = "this feature will allow a user to send a private message to another user";
        break; 
             
      default:
        reply = "Unknown command, for the command list type /command";
        break;
    }
    
    logMessage('Server', reply);
  }

  //Updates the channel list
  function updateChannel (channel) {
    var channelAra = [];

    channelAra.push(channel);
    var channelId = Channels.findOne();

    //Updates the Channels object
    Channels.update(channelId._id, {$set: 
      {channel: channelAra}
    });

  }

  //Updates the userlist 
  function updateNicks(nicks) {
    var nickAra = [];

    for (var property in nicks) {
      if (nicks.hasOwnProperty(property)) {
        nickAra.push(property);
      }
    }

    //finds the only User object in the collection
    var nickId = Nicks.findOne();

    //Updates the User object
    Nicks.update(nickId._id, {$set: 
      {nicks: nickAra}
    });
  }






  Meteor.methods({
    //Allows the client to connect to a specified channel
    'ircConnect' : function(nick, server, channel) {
      currentNick = nick;
      currentServer = server;
      currentChannel = channel;

      isConnected = true;
      client = ircAdd();
    },

    //Allows the client to send a message 
    'sendMessage': function(message) {
      if (isConnected == true) {

        if (message[0] == '/') {
          commandResponse(message);
        }

        else {
          client.say(currentChannel, message);
          console.log(currentNick + ' => ' + currentChannel + ': ' + message);
          logMessage('< ' + currentNick, message);
        } 
      }

      else {
        logMessage('Server', 'you are not connected yet, please wait to send another message.');
      }
    },

    //Allows the client to clear the messages
    'clearMessages' : function() {
      Messages.remove({});
    },

    'ircLogout' : function() {
      if (isConnected == true) {
        logMessage(currentNick, 'You have left the channel');
        isConnected = false;
        clearDB();
        client.disconnect();
      }
    }

  });



}