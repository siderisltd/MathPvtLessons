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
var NodeCache = require("node-cache");
var gCalendar = require('./res/scripts/gcalendar');

var cache = new NodeCache();
const CACHE_TOKEN_KEY = 'calTok';

const googleClientSecret = '7PDq0IB5zbMfjJ1dEdB6Dlao',
    googleClientId = '534907550816-909ib4memji5df5841fen2fbhvq6rniu.apps.googleusercontent.com',
    googleRefreshToken = '1/o6smPHr7MALCK4s1OTjmJmBhOEnRjG5Br8Ejwvr5AHY',
    googleRedirectUrl = ['urn:ietf:wg:oauth:2.0:oob', 'http://localhost'];

var app = express();

app.enable('trust proxy');

var dev = true;
var secret = '2JH6stayiISADHYasdhaghgu123jhhsad6';

var emailUsername = 'urokmatematika@yahoo.com';
var emailPassword = 'NeliKancheva123';

var emailReceiver = 'siderisltd@gmail.com'

app.engine('ejs', engine);
app.set('view engine', 'ejs');

app.use(session({
    secret: 'IADJHAKSDHA&ÂS*^D@4hJ&*&(!@(€С§ААСДХгад-hhwgejqhgjh3242!276njGJAsd8asd76',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 } //cookie: { maxAge: 3600000 * 4 } // 4 hours
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

app.post('/calendar/getHours', function(req, res) {
    var pickedDate = req.body.pickedDate;
    var includeWeekends = req.body.includeWeekends;

    // get free hours from google calendar and pass to view
    gCalendar.authorize(googleClientSecret, googleClientId, googleRefreshToken, googleRedirectUrl).then(function(auth, err) {
        if (err) {
            console.log(err);
        } else {

            gCalendar.getAvailableTimeArr(auth, pickedDate).then(function(hours) {

                var weekdays = [7];
                weekdays[0] = "Нед";
                weekdays[1] = "Пон";
                weekdays[2] = "Вто";
                weekdays[3] = "Сря";
                weekdays[4] = "Чет";
                weekdays[5] = "Пет";
                weekdays[6] = "Съб";

                var result = {};

                for (var i = 1; i < weekdays.length; i += 1) {
                    result[weekdays[i]] = [];
                }
                result[weekdays[0]] = [];

                hours.map(function(hour) {
                    var shortHourString = hour.getHours() + ":" + ('0' + hour.getMinutes()).slice(-2);
                    result[weekdays[hour.getDay()]] = result[weekdays[hour.getDay()]];
                    result[weekdays[hour.getDay()]].push({ short: shortHourString, long: hour });
                });

                return res.render('weeklyHours', { model: result });
            });
        }
    });

});


var requestLimiter = new RateLimit({
    windowMs: 3600000 * 4, // 4 hrs
    max: 1, // start blocking after 1 requests 
    message: "Изглежда, че вече сте запазили час. Ще може да запазите нов след 4 часа."
});

app.get('/zapazi-chas-za-urok-po-matematika', cacheControl('no-cache'), function(req, res) {

    if (!req.session.secret && !req.session.hasBooked) {
        res.render('booking', { pageId: 'booking' });
    } else {

        var remainingTime = msToTime(req.session.cookie.maxAge);

        res.render('alreadyBooked', { remainingTime: remainingTime });
    }
});

//TODO: add requestLimiter before cacheControl middleware
app.post('/zapazi-chas-za-urok-po-matematika', cacheControl('no-cache'), function(req, res) {

    if (!req.session.secret) {
        var name = req.body.name;
        var phone = req.body.phone;
        var lessonFor = req.body.lessonsClass;
        var forCustomerAddress = req.body.address === 'own';
        var forTeacherAddress = req.body.address === 'teacher';
        var address = req.body.ownAddress;
        var lessonAddress = '';
        var emailAddress = req.body.email;
        var teacherPhoneNum = '0876 552 454';
        var lessonStartDate = new Date(req.body.hour);
        var lessonEndDate = new Date(new Date(lessonStartDate).setHours(lessonStartDate.getHours() + 1));

        if (!name || !phone || !lessonFor || (forCustomerAddress && !address) || !emailAddress) {
            res.render('booking', {
                pageId: 'booking',
            });
        }

        var transporter = nodemailer.createTransport({
            service: 'Yahoo',
            auth: {
                user: emailUsername,
                pass: emailPassword
            }
        });

        var text = 'Здравей! \nТоку що ' + name + ' запази урок по математика.\nТелефонът му е: ' + phone + '\nЖелае урока да бъде проведен на ';

        if (forCustomerAddress) {
            text += 'негов адрес, който е: ' + address;
            lessonAddress = address;
        } else if (forTeacherAddress) {
            text += 'твой адрес';
            lessonAddress = 'жк. Илинден 15-2'
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


        // google calendar event
        gCalendar.authorize(googleClientSecret, googleClientId, googleRefreshToken, googleRedirectUrl).then(function(auth, err) {

            if (err) {
                console.log(err);
            } else {

                var startDate = lessonStartDate;
                var endDate = lessonEndDate;
                var teacherPhone = teacherPhoneNum;
                var classNum = lessonFor;
                var location = lessonAddress;
                var attendeeEmail = emailAddress;

                gCalendar.insertEvent(auth, startDate, endDate, classNum, location, teacherPhone, attendeeEmail);
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
    if ((!req.session.secret || !passwordHash.verify(secret, req.session.secret)) || req.session.hasBooked) {
        res.redirect('/');
    } else {
        //req.session.hasBooked = 'true';

        res.render('successBooking');
    }
});

app.get('/chastni-uroci-po-matematika-ceni', cacheControl({ maxAge: 86400000 * 3 }), function(req, res) {
    res.render('prices', { pageId: 'prices' })
});

app.get('/chastni-uroci-po-matematika-ceni/individualni-zanimaniq', cacheControl({ maxAge: 86400000 * 3 }), function(req, res) {
    res.render('individualLessons', { pageId: 'prices' })
});

app.get('/chastni-uroci-po-matematika-ceni/grupovi-zanimaniq', cacheControl({ maxAge: 86400000 * 3 }), function(req, res) {
    res.render('groupLessons', { pageId: 'prices' })
});

app.get('/chastni-uroci-po-matematika-ceni/abonamenti', cacheControl({ maxAge: 86400000 * 3 }), function(req, res) {
    res.render('subscriptions', { pageId: 'prices' })
});

app.get('/chastni-uroci-po-matematika/za-uchitelq', cacheControl({ maxAge: 86400000 * 3 }), function(req, res) {
    res.render('teacher', { pageId: 'teacher' })
});

app.get('*', function(req, res) {
    res.status(400);
    res.render('errors/404');
});

// setInterval(function() {
//     request('https://calingappreqs.herokuapp.com/', function(error, response, body) {
//         if (!error && response.statusCode == 200) {
//             console.log(body);
//         }
//     })
// }, 20 * 1000 * 60); // 20 mins


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

function getCachedCredentials() {
    return cache.get(CACHE_TOKEN_KEY)
}

function setCacheGoogleCredentials(auth) {
    var t1 = new Date(auth.credentials.expiry_date).toISOString();
    var t2 = new Date().toISOString();
    var dif = new Date(t1).getTime() - new Date(t2).getTime();
    var expDiffInSeconds = dif / 1000;

    cache.set(CACHE_TOKEN_KEY, auth.credentials, expDiffInSeconds - 60);
}