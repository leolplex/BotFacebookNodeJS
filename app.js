const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const APP_TOKEN = 'YOUR_TOKEN_FACEBOOK';


const apiai = require('apiai');
const apiaiApp = apiai("YOUR_API_APIAI");

var app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.listen(3000, function () {
    console.log('Server listen localhost:3000');
})

app.get('/', function (req, res) {
    res.send('Abriendo el puerto desde mi pc local con https://ngrok.com/');
})

app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'hello_token') {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});


/* Handling all messenges */
app.post('/webhook', (req, res) => {
    console.log(req.body);
    if (req.body.object === 'page') {
        req.body.entry.forEach((entry) => {
            entry.messaging.forEach((event) => {
                if (event.message && event.message.text) {
                    sendMessage(event);
                }
            });
        });
        res.status(200).end();
    }
});


/* GET query from API.ai */
function sendMessage(event) {
    let sender = event.sender.id;
    let text = event.message.text;

    console.log(sender);
    let apiai = apiaiApp.textRequest(text, {
        sessionId: 'tabby_cat'
    });

    apiai.on('response', (response) => {
        console.log(response)
        let aiText = response.result.fulfillment.speech;
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: { access_token: APP_TOKEN },
            method: 'POST',
            json: {
                recipient: { id: sender },
                message: {
                    text: aiText,
                },
            }
        }, (error, response) => {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
        });
    });

    apiai.on('error', (error) => {
        console.log(error);
    });

    apiai.end();
}