const login = require("facebook-chat-api");
const config = require('./login');

login({email: config.useraccount.email, password: config.useraccount.password}, (err, api) => {
    if(err) {
    	console.log(config.email)
    	return console.error(err);
    } 
    // Here you can use the api
});