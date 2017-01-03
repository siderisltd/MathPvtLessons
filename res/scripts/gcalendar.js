var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var NodeCache = require("node-cache");
var q = require("q");

var cache = new NodeCache();
const CACHE_TOKEN_KEY = 'calTok';


module.exports = {
    authorize: authorize,
    getAvailableTimeArr: getAvailableTimeArr,
    insertEvent: insertEvent
};


// authorize().then(function(auth, err) {
//     if (err) {
//         console.log(err);
//     } else {
//         getAvailableTimeArr(auth);
//     }
// });



// authorize().then(function(auth, err) {
//     if (err) {
//         console.log(err);
//     } else {
//         insertEvent(auth, startDate, endDate, classNum, location, teacherPhone, attendeeEmail);
//     }
// });


function authorize(clientSecret, clientId, refreshToken, redirectUrl, auth) {

    var deferred = q.defer(),
        auth = new googleAuth(),
        oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    var credentials = cache.get(CACHE_TOKEN_KEY);
    console.log('cached creds: ' + credentials);

    if (!credentials) {
        getNewToken(oauth2Client, refreshToken).then(function(token) {
            var t1 = new Date(token.expiry_date).toISOString();
            var t2 = new Date().toISOString();
            var dif = new Date(t1).getTime() - new Date(t2).getTime();
            var expDiffInSeconds = dif / 1000;

            cache.set(CACHE_TOKEN_KEY, token, expDiffInSeconds - 60); // minus one minute to avoid possible unpredicted behaviour

            oauth2Client.credentials = token;

            deferred.resolve(oauth2Client);
        });
    } else {
        oauth2Client.credentials = credentials;
        deferred.resolve(oauth2Client);
    }

    return deferred.promise;
}

function getNewToken(oauth2Client, refreshToken) {
    var deferred = q.defer();

    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    console.log('getting new token');

    oauth2Client.refreshAccessToken(function(err, token) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(token);
        }
    });

    return deferred.promise;
}

function insertEvent(auth, start, end, classNum, location, teacherPhone, attendeeEmail) {

    var deferred = q.defer();

    var calendar = google.calendar('v3');
    calendar.events.insert({
        auth: auth,
        calendarId: 'primary',
        resource: {
            summary: 'Запазен час за урок по математика',
            description: 'Урок по математика за  ' + classNum + ' клас. При въпроси или проблеми, можете да ме потърсите на тел: ' + teacherPhone,
            location: location,
            start: {
                dateTime: start,
                timeZone: 'UTC+2:00'
            },
            end: {
                dateTime: end,
                timeZone: 'UTC+2:00'
            },
            attendees: [
                { email: attendeeEmail },
                { email: 'urocimatematikaneli@gmail.com' }
            ],
            reminders: {
                useDefault: false,
                overrides: [{
                        method: 'email',
                        minutes: 3 * 60
                    },
                    {
                        method: 'popup',
                        minutes: 30
                    }
                ]
            }
        }

    }, function(err, response) {
        if (err) {
            deferred.reject(err);
        }

        deferred.resolve(response);
    });

    return deferred.promise;
}


function getAvailableTimeArr(auth, pickedDate) {

    var deferred = q.defer();

    var calendar = google.calendar('v3');

    var currSofia = new Date(pickedDate).toLocaleString('en-US', { timeZone: 'Europe/Sofia' });
    var curr = new Date(currSofia);
    var first = curr.getDate() - curr.getDay() + 1;
    var last = first + 6;

    var firstDayOfWeek = new Date(curr.setDate(first)).toISOString();
    var lastDayOfWeek = new Date(new Date(curr.setDate(last)).setHours(23, 59, 00)).toISOString();

    console.log('firstDayOfWeek:' + firstDayOfWeek);
    console.log('lastDayOfWeek: ' + lastDayOfWeek);


    calendar.events.list({
        auth: auth,
        calendarId: 'primary',
        singleEvents: true,
        orderBy: 'startTime',
        timeMin: firstDayOfWeek,
        timeMax: lastDayOfWeek,

    }, function(err, response) {
        if (err) {
            deferred.reject('The API returned an error: ' + err);
        }
        var events = response.items;
        if (events.length == 0) {
            deferred.reject('No upcoming events found.');
        } else {
            var availableHours = getAvailableHours(events, firstDayOfWeek, lastDayOfWeek);

            deferred.resolve(availableHours);
        }
    });

    return deferred.promise;
}

function hoursCompare(time1, time2) {
    var t1 = new Date();
    var parts = time1.split(":");
    t1.setHours(parts[0], parts[1], parts[2], 0);
    var t2 = new Date();
    parts = time2.split(":");
    t2.setHours(parts[0], parts[1], parts[2], 0);

    // returns 1 if greater, -1 if less and 0 if the same
    if (t1.getTime() > t2.getTime()) return 1;
    if (t1.getTime() < t2.getTime()) return -1;
    return 0;
}

Date.prototype.addDays = function(days) {
    var dat = new Date(this.valueOf())
    dat.setDate(dat.getDate() + days);
    return dat;
}

function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push(currentDate)
        currentDate = currentDate.addMinutes(30);
    }
    return dateArray;
}

function getFreeTime(events, weekDay, firstHourTimeString, lastHourTimeString, interval) {
    var dateArray = [];

    var availableFrom = 08;
    var availableTo = 20;

    var fromTimeToday = new Date(new Date(weekDay).setHours(availableFrom, 0, 0));
    var toTimeToday = new Date(new Date(weekDay).setHours(availableTo, 0, 0));

    var eventsToday = [];

    events.map(function(event) {
        if (new Date(event.start.dateTime).getDay() == fromTimeToday.getDay()) {
            eventsToday.push(event);
        }
    });

    for (var i = fromTimeToday; i <= toTimeToday; i.setMinutes(i.getMinutes() + 30)) {
        dateArray.push(new Date(i));
    }

    dateArray = dateArray.filter(function(x) {
        var isBetween = eventsToday.every(function(event) {

            var evDate = new Date(event.start.dateTime);


            var eventWithUpperMargin = new Date(event.end.dateTime);
            eventWithUpperMargin.setMinutes(evDate.getMinutes() + 30); //  30 mins transportation after lesson

            var eventWithLowerMargin = new Date(event.start.dateTime);
            eventWithLowerMargin.setMinutes(evDate.getMinutes() - 90); // 90 min before event

            var isBet = x > eventWithLowerMargin && x < eventWithUpperMargin

            return !isBet;
        })

        if (eventsToday.length == 0) {
            return true;
        } else {
            return isBetween;
        }
    })

    return dateArray;
}

function getAvailableHours(events, firstDayOfWeek, lastDayOfWeek) { // !!! Important : in order this to work properly there should be events for every day - otherways, available hours will not be listed

    var availableFrom = 08;
    var availableTo = 21;

    var firstDay = new Date(new Date(firstDayOfWeek).setHours(availableFrom, 0, 0));
    var lastDay = new Date(new Date(lastDayOfWeek).setHours(availableTo, 0, 0));

    var availableHours = [];

    var firstHourTimeString = firstDay.toTimeString().split(' ')[0];
    var lastHourTimeString = lastDay.toTimeString().split(' ')[0];
    var interval = 30;

    for (var weekDay = firstDay; weekDay <= lastDay; weekDay = weekDay.addDays(1)) {

        var hoursToday = getFreeTime(events, weekDay, firstHourTimeString, lastHourTimeString, interval);
        availableHours = availableHours.concat(hoursToday);
    }

    //console.log(availableHours);
    return availableHours;
}