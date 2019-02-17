const login = require("facebook-chat-api");
const config = require('./login');
const request = require('request');
const dialogflow = require('dialogflow');
const uuid = require('uuid');
const c3ChartMaker = require('c3-chart-maker');
const fs = require("fs");



function follow() {
    api.sendMessage("What else can I tell you?", event.threadID);
}

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
  return result;
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
            runSample(event.body).catch(console.error).then(function(result) {
                if(result.intent.displayName == "Default Welcome Intent") {
                    api.sendMessage(result.fulfillmentText, event.threadID);
                }

                else if (result.intent.displayName == "Invest") {
                    ticker = result.fulfillmentText;
                    request('https://api.coincap.io/v2/assets/'+ticker, function (error, response, body) {
                        api.sendMessage(error, event.threadID); // Print the error if one occurred
                        api.sendMessage("response" + response && response.statusCode, event.threadID);
                        if (body) {
                            var data = JSON.parse(body);

                            api.sendMessage(data['data']['symbol'] + " has changed by " + data['data']['changePercent24Hr'] + "% in the last 24 hours.", event.threadID, () => {
                                //console.log(data['data']['changePercent24Hr'])
                                if (data['data']['changePercent24Hr'] > 0){
                                    api.sendMessage("You should consider investing! If you sign into ShapeShift, I can even invest for you.", event.threadID);
                                }
                                else {
                                    api.sendMessage("Looks like this isn't doing so well, maybe try something else?", event.threadID);
                                }
                            });
                        }                        
                    });
                }

                
                else {
                    reply = result.fulfillmentText;
                    res = reply.split(" ");
                    action = res[0];
                    ticker = res[1];
                    if(action == "graph") {
                        request('https://api.coincap.io/v2/assets/'+ticker+'/history?interval=h1', function (error, response, body) {
                            api.sendMessage(error, event.threadID); // Print the error if one occurred
                            api.sendMessage("response" + response && response.statusCode, event.threadID); // Print the response status code if a response was received
                            if(body) {
                                var res = JSON.parse(body);
                                var wrangle = res['data'];
                                // var final = []
                                // for(var i = 0; i < wrangle.length; i++) {
                                //     final.push(wrangle[i]['priceUsd']);
                                // }
                                const yourData = wrangle;
                                const chartDefinition = { 
                                    data: {
                                       json: yourData,
                                       keys: {
                                           value: ['priceUsd'],
                                       },
                                       axis: {
                                          x: {
                                              type: 'timeseries',
                                          }
                                      }
                                    }
                                }
                                const outputFilePath = "images/graph.png";

                                c3ChartMaker(yourData, chartDefinition, outputFilePath)
                                    .then(() => { 
                                        var msg = {
                                            body: "Graphed!",
                                            attachment: fs.createReadStream(__dirname + '/images/graph.png')
                                        }
                                        api.sendMessage(msg, event.threadID, () => { console.log("done"); });
                                    })
                                    .catch(err => {
                                        console.error(err);
                                    });
                            }
                        });
                    }
                    else {
                        request('https://api.coincap.io/v2/assets/'+ticker, function (error, response, body) {
                            api.sendMessage(error, event.threadID); // Print the error if one occurred
                            api.sendMessage("response" + response && response.statusCode, event.threadID); // Print the response status code if a response was received
                            if(body) {
                                var data = JSON.parse(body);
                                switch(action) {
                                    case 'priceUsd':
                                        api.sendMessage(data['data']['symbol'] + " is $" + data['data'][action], event.threadID, () => { api.sendMessage("What else can I tell you?", event.threadID); });
                                        break;
                                    case 'supply':
                                        // code block
                                        api.sendMessage("The supply of "+data['data']['symbol'] + " is " + data['data'][action], event.threadID, () => { api.sendMessage("Anything else?", event.threadID); });
                                        break;
                                    case 'volumeUsd24Hr':
                                        // code block
                                        api.sendMessage("The volume of "+data['data']['symbol'] + " is " + data['data'][action], event.threadID, () => { api.sendMessage("What else can I help with?", event.threadID); });
                                        break;
                                    case 'marketCapUsd':
                                        // code block
                                        api.sendMessage("The market cap  of "+data['data']['symbol'] + " is " + data['data'][action], event.threadID, () => { api.sendMessage("What else do you want to know?", event.threadID); });
                                        break;
                                    case 'changePercent24Hr':
                                        // code block
                                        api.sendMessage(data['data']['symbol'] + " has changed by " + data['data'][action], event.threadID + "% in the last 24 hours.");
                                        break;
                                    default:
                                        api.sendMessage(data['data']['symbol'] + " is " + data['data'][action], event.threadID);
                                    }
                                    
                                }

                        });

                    }
                    
                }
            })
        	
        }    
    });

});