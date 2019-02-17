const login = require("facebook-chat-api");
const config = require('./login');
const request = require('request');
const dialogflow = require('dialogflow');
const uuid = require('uuid');



//nlp 
process.env.GOOGLE_APPLICATION_CREDENTIALS = './auth.json'

async function runSample(querytext, projectId = 'shapeshift-7d05c') {
  // A unique identifier for the given session
  const sessionId = uuid.v4();
  //const {Storage} = require('@google-cloud/storage');

  // Create a new session
  const sessionClient = new dialogflow.SessionsClient();
  const sessionPath = sessionClient.sessionPath(projectId, sessionId);

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        // The query to send to the dialogflow agent
        text: querytext,
        // The language used by the client (en-US)
        languageCode: 'en-US',
      },
    },
  };

  // Send request and log result
  const responses = await sessionClient.detectIntent(request);
  console.log('Detected intent');
  const result = responses[0].queryResult;
  console.log(`  Query: ${result.queryText}`);
  console.log(`  Response: ${result.fulfillmentText}`);
  if (result.intent) {
    console.log(`  Intent: ${result.intent.displayName}`);
  } else {
    console.log(`  No intent matched.`);
  }
  return result.fulfillmentText;
}


//chat process
login({email: config.useraccount.email, password: config.useraccount.password}, (err, api) => {
    if(err) {
    	return console.error(err);
    } 
    // Here you can use the api

    api.setOptions({
      logLevel: "silent"
    });

    var stopListening = api.listen((err, event) => {
        if(err) return console.error(err);
        if(event.body === '/stop') {
            api.sendMessage("Goodbye...", event.threadID);
            return stopListening();
        }
        else {
            runSample(event.body).catch(console.error).then(function(reply) {
                res = reply.split(" ");
                action = res[0];
                ticker = res[1];
                request('https://api.coincap.io/v2/assets/'+ticker, function (error, response, body) {
                    api.sendMessage(error, event.threadID); // Print the error if one occurred
                    api.sendMessage("response" + response && response.statusCode, event.threadID); // Print the response status code if a response was received
                    if(body) {
                        var data = JSON.parse(body);
                        console.log(data)
                        api.sendMessage(data['data']['symbol'] + " is " + data['data'][action], event.threadID);
                    }
                });
            })
        	
        }    
    });

});