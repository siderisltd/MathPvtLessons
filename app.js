var express = require('express');
var path = require('path');
var request = require('request');
var engine = require('ejs-mate');

var app = express();

var dev = true;

app.engine('ejs', engine);
app.set('view engine', 'ejs')

app.use("/res", express.static(__dirname + '/res'));
app.use("/node_modules", express.static(__dirname + '/node_modules'));

app.use("/dist", express.static(__dirname + '/dist'));
app.use("views", express.static(__dirname + '/views'));


app.get('/', function(req, res) {
    res.render('index', { dev: dev })
});

app.get('*', function(req, res) {
    res.send('what???', 404);
});

setInterval(function() {
    request('https://calingappreqs.herokuapp.com/', function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body) // Show the HTML for the Google homepage.
        }
    })
}, 20 * 1000 * 60); // 20 mins


app.listen(process.env.PORT || 3000);