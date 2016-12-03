var express = require('express');
var path = require('path');
var request = require('request');
var engine = require('ejs-mate');
var cacheControl = require('express-cache-controlfreak');
var session = require('express-session');
var passwordHash = require('password-hash');
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
var RateLimit = require('express-rate-limit');

var app = express();

app.enable('trust proxy');

var dev = true;
var secret = '2JH6stayiISADHYasdhaghgu123jhhsad6';

var emailUsername = 'urokmatematika@yahoo.com';
var emailPassword = 'NeliKancheva123';

var emailReceiver = 'kancheva.neli@gmail.com'

app.engine('ejs', engine);
app.set('view engine', 'ejs');

app.use(session({
    secret: 'IADJHAKSDHA&ÂS*^D@4hJ&*&(!@(€С§ААСДХгад-hhwgejqhgjh3242!276njGJAsd8asd76',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 / 4 } //cookie: { maxAge: 3600000 * 4 } // 4 hours
}));

app.use("/res", express.static(__dirname + '/res'));
app.use("/node_modules", express.static(__dirname + '/node_modules'));
app.use("/dist", express.static(__dirname + '/dist'));
app.use("views", express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', cacheControl({ maxAge: 86400000 * 3 }), function(req, res) { // 3 days
    res.render('index', { pageId: 'index' })
});

app.get('/chastni-uroci-po-matematika', cacheControl({ maxAge: 86400000 * 3 }), function(req, res) {
    res.render('lessons', { pageId: 'lessons' })
});

app.get('/zapazi-chas-za-urok-po-matematika', cacheControl('no-cache'), function(req, res) {

    if (!req.session.secret) {
        res.render('booking', { pageId: 'booking' })
    } else {

        var remainingTime = msToTime(req.session.cookie.maxAge);

        res.render('alreadyBooked', { remainingTime: remainingTime });
    }
});


var requestLimiter = new RateLimit({
    windowMs: 3600000 / 4, // 3600000 * 4 // 4 hrs
    max: 1, // start blocking after 1 requests 
    message: "Изглежда, че вече сте запазили час. Ще може да запазите нов след 4 часа."
});

//TODO: add requestLimiter before cacheControl middleware
app.post('/zapazi-chas-za-urok-po-matematika',requestLimiter, cacheControl('no-cache'), function(req, res) {

    if (!req.session.secret) {
        var name = req.body.name;
        var phone = req.body.phone;
        var lessonFor = req.body.lessonsClass;
        var forCustomerAddress = req.body.address === 'own';
        var forTeacherAddress = req.body.address === 'teacher';
        var address = req.body.ownAddress;

        var transporter = nodemailer.createTransport({
            service: 'Yahoo',
            auth: {
                user: emailUsername,
                pass: emailPassword
            }
        });

        var text = 'Здравей Нели! \nТоку що ' + name + ' запази урок по математика.\nТелефонът му е: ' + phone + '\nЖелае урока да бъде проведен на ';

        if (forCustomerAddress) {
            text += 'негов адрес, който е: ' + address;
        } else if (forTeacherAddress) {
            text += 'твой адрес'
        }

        text += '\nПоздрави и успешен ден!';

        var mailOptions = {
            from: emailUsername, // sender address
            to: emailReceiver, // list of receivers
            subject: 'Частен урок по математика', // Subject line
            text: text
        };

        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log(error);
            }
        });

        // console.log('name: ' + name);
        // console.log('phone: ' + phone);
        // console.log('klas: ' + lessonFor);
        // console.log('tehen adres: ' + forCustomerAddress);
        // console.log('adres na uchitelq: ' + forTeacherAddress);

        // validate data if not return to form with filled data

        req.session.secret = passwordHash.generate(secret);

        // set appointment in the calendar

        res.redirect('/blagodarim-che-zapazihte-chas');
    } else {
        res.render('alreadyBooked');
    }
});

app.get('/blagodarim-che-zapazihte-chas', cacheControl('no-cache'), function(req, res) {
    if ((!req.session.secret || !passwordHash.verify(secret, req.session.secret)) && !req.session.hasBooked) {
        res.redirect('/');
    } else {
        //req.session.hasBooked = 'true';

        res.render('successBooking');
    }
});

app.get('/chastni-uroci-po-matematika-ceni', cacheControl({ maxAge: 86400000 * 3 }), function(req, res) {
    res.render('prices', { pageId: 'prices' })
});

app.get('/chastni-uroci-po-matematika/za-uchitelq', cacheControl({ maxAge: 86400000 * 3 }), function(req, res) {
    res.render('teacher', { pageId: 'teacher' })
});

app.get('*', function(req, res) {
    res.status(400);
    res.render('errors/404');
});

setInterval(function() {
    request('https://calingappreqs.herokuapp.com/', function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
        }
    })
}, 20 * 1000 * 60); // 20 mins


app.listen(process.env.PORT || 8081);


function msToTime(s) {

    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;

    var result = {
        hrs: hrs,
        mins: mins
    }

    return result;
}