const login = require("facebook-chat-api");
const config = require('./login');
const request = require('request');


login({email: config.useraccount.email, password: config.useraccount.password}, (err, api) => {
    if(err) {
    	return console.error(err);
    } 
    // Here you can use the api

    api.setOptions({
      selfListen: true,
      logLevel: "silent",
      listenEvents: true
    });

    var stopListening = api.listen((err, event) => {
        if(err) return console.error(err);

        switch(event.type) {
            case "message":
                if(event.body === '/stop') {
                    api.sendMessage("Goodbye...", event.threadID);
                    return stopListening();
                }
                else if (event.body == 'price') {
                	//mark message as read
                	api.markAsRead(event.threadID, (err) => {
                    	if(err) console.log(err);
                	});

                	

                	api.sendMessage("TEST BOT: " + event.body, event.threadID);
                }              
                
                break;
            case "event":
                console.log(event);
                break;
        }
    });

    // api.getUserID("Shirlyn Prabahar", function(err, data) {
    //     if(err) return callback(err);

    //     // Send the message to the best match (best by Facebook's criteria)
    //     threadID = data[0].userID;
    //     api.sendMessage('test', threadID);
    // });
});