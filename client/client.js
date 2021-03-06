//Meteor Client JS

if (Meteor.isClient) {

  //Used for the scrollBottom() function
  var msgCounter = 0;

  //Allows client to access mongo collections
  Messages = new Mongo.Collection("messages");
  Nicks = new Mongo.Collection("nicks");
  Channels = new Mongo.Collection("channels");


  //give all quotes to client
  Template.quotes.helpers({quoteslist: }); //read from disk



  //These helpers allow meteor objects to display on the GUI
  Template.irc.helpers({

    //Helper renders the messages in the chat window
    messages: function() {
      var pulledMessages = [];       
      var cursor = Messages.find().fetch();
      var i = 0;

      cursor.forEach(function(document) {
          var time = formatTime(document.time);

          pulledMessages.push({
            message: time + document.from + ': ' + document.message, position: i
          });
          //Scrolls to the bottom if a new message has been added
          if (msgCounter < i) {
            scrollBottom();
            msgCounter = i;
          }
          i++;
      });

      return pulledMessages.slice();
    },

    //Helper renders the current user list
    nicks : function() {
      var pulledNicks = [];
      var cursor = Nicks.find().fetch();
      var i = 0;

      cursor.forEach(function(document) {
        for (index = 0; index < document.nicks.length; ++index) {
          pulledNicks.push(document.nicks[index]);
        }
        i++;
      });

      return pulledNicks.slice();
    },

    channels : function() {
      var pulledChannels = [];
      var cursor = Channels.find().fetch();
      var i = 0;

      cursor.forEach(function(document) {
        for (index = 0; index < document.channel.length; ++index) {
          pulledChannels.push(document.channel[index]);
        }
        i++;
      });

      return pulledChannels.slice();
    }
  });

  //When a message is entered, scroll to the bottom
  function scrollBottom() {
    $(".chat-window").animate({
      scrollTop: $(".chat-window")[0].scrollHeight},
      $(".chat-window").height()
    );
  }
  
  //Formats the timestamp displayed in the irc chat
  function formatTime(milli) {
    var date =  new Date(milli);
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();

    if(minutes < 10){
        minutes = '0' + minutes;
    }

    if(seconds < 10){
        seconds = '0' + seconds;
    }

    return '[' + date.getHours() + ':' + minutes + ':' + seconds + '] ';
  }

  Template.connect.events({
    //These events allow the send message and enter key to send messages to the irc channel
    'click #connect-btn': function(event, template) {
      Meteor.call('ircConnect', template.find('#nick-name').value, 
      template.find('#server-name').value, template.find('#channel-name').value);
      $('#nick-name').val('');
      $('#server-name').val('');
      $('#channel-name').val('');
      Router.go('irc');
    }

  }); 

  Template.login.events({
    //Registers a new user into the meteor user db
    'click #register-btn': function(event, template) {
      var user = {
        "email": $('#register-email').val(),
        "password": $('#register-password').val()
      }

      Accounts.createUser(user);
      console.log(user.email + " has registered");
      Meteor.loginWithPassword(user.email, user.password);
      Router.go('connect');

      $('#register-email').val('');
      $('#register-password').val('');
    },

    //Logs a registered user into jakeIRC
    'click #login-btn': function(event, template) {
      var email = $('#login-email').val();
      var password = $('#login-password').val();

      Meteor.loginWithPassword(email, password, function (error) {
        //Catches login errors if they occur
        if (error) {
          console.log("login attempt failed");
          console.log(error);
        }

        else {
          Router.go('connect')
        }

      });

      $('#login-email').val('');
      $('#login-password').val('');
    }

  }); 

  Template.irc.events({
    //These events allow the send message and enter key to send messages to the irc channel
    'click #msg-btn': function(event, template) {
      Meteor.call('sendMessage', template.find('#msg-bar').value);
      $('#msg-bar').val('');
    },

    'keypress #msg-bar': function(event, template) {
      if(event.charCode == 13){
        Meteor.call('sendMessage', template.find('#msg-bar').value);
        $('#msg-bar').val('');
      }
    },

    //Allows the user to clear the messages on the screen
    'click #clear-btn' : function (event, template) {
      event.preventDefault();
      Meteor.call('clearMessages');
    },

    //Allows the user to close the current channel
    'click .close-channel' : function (event, template) {
      event.preventDefault();
      Meteor.call('ircLogout');
      Router.go('connect');
    }

  });



//Relocates the user when they click on the header buttons
  Template.header.events({ 
    'click #irc-btn': function(event, template) {
        event.preventDefault();
        Router.go('irc');
    },

    'click #connect-btn': function(event, template) {
        event.preventDefault();
        Router.go('connect');
    },

    'click #help-btn': function(event, template) {
        event.preventDefault();
        Router.go('help');
    },

    'click #login-btn' : function (event, template) {
      event.preventDefault();
      Router.go('login');
    },

    'click #logout-btn' : function (event, template) {
      event.preventDefault();
      Meteor.call('ircLogout');
      Meteor.logout();
      Router.go('login');
    }
  });


}