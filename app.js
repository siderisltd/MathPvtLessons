var express = require('express');
var path = require('path');
var request = require('request');
var engine = require('ejs-mate');

var app = express();

var dev = false;

app.engine('ejs', engine);
app.set('view engine', 'ejs')

app.use("/res", express.static(__dirname + '/res'));
app.use("/node_modules", express.static(__dirname + '/node_modules'));

app.use("/dist", express.static(__dirname + '/dist'));
app.use("views", express.static(__dirname + '/views'));


app.get('/', function(req, res) {
    res.render('index', { dev: dev, pageId: 'index' })
});

app.get('/chastni-uroci-po-matematika', function(req, res) {
    res.render('lessons', { dev: dev, pageId: 'lessons' })
});

app.get('/zapazi-chas-za-urok-po-matematika', function(req, res) {
    res.render('booking', { dev: dev, pageId: 'booking' })
});

app.get('/chastni-uroci-po-matematika-ceni', function(req, res) {
    res.render('prices', { dev: dev, pageId: 'prices' })
});

app.get('/chastni-uroci-po-matematika/za-uchitelq', function(req, res) {
    res.render('teacher', { dev: dev, pageId: 'teacher' })
});

app.get('*', function(req, res) {
    res.send('TODO: Create 404 page', 404);
});

setInterval(function() {
    request('https://calingappreqs.herokuapp.com/', function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body) // Show the HTML for the Google homepage.
        }
    })
}, 20 * 1000 * 60); // 20 mins


app.listen(process.env.PORT || 3000);