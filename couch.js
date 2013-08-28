var config = require('./config.json');
var events = require('events');
module.exports = Couch;

function Couch() {
    events.EventEmitter.call(this);
}

Couch.super_ = events.EventEmitter;
Couch.prototype = Object.create(events.EventEmitter.prototype, {
    constructor: {
        value: Couch,
        enumerable: false
    }
});

Couch.prototype.getLastVolunteerEntry = function() {
    var self = this;
    self.lastVolunteerEntry = 0;

    // Get the count.
    var http = require('http');

    var options = {
      host: config.target_db.host,
      port: config.target_db.port,
      path: config.volunteers.db_existing_entries_view_path,
      headers: {
         'Authorization': 'Basic ' + new Buffer(config.target_db.user + ':' + config.target_db.pass).toString('base64')
       }
    };

    callback = function(response) {
      var str = '';

      //another chunk of data has been recieved, so append it to `str`
      response.on('data', function (chunk) {
        str += chunk;
      });

      //the whole response has been recieved, so we just print it out here
      response.on('end', function () {
        //console.log(str);
        var viewObj = JSON.parse(str);
        var rows = viewObj.rows;
        self.lastVolunteerEntry = (rows && rows.length > 0 ? rows[0].key : 0);
        self.emit('found', self.lastVolunteerEntry);
      });
    }

    http.request(options, callback).end();

    return self;
}

Couch.prototype.insertDocs = function(docs) {
    var self = this;
    self.results = {};
    var postData = JSON.stringify(docs);

    // Insert the docs.
    var http = require('http');

    var options = {
      host: config.target_db.host,
      port: config.target_db.port,
      path: config.volunteers.db_bulk_insert_path,
      method: 'POST',
      headers: {
         'Authorization': 'Basic ' + new Buffer(config.target_db.user + ':' + config.target_db.pass).toString('base64'),
         'Content-Type': 'application/json',
         'Content-Length': postData.length
       }
    };

    callback = function(response) {
      var str = '';

      //another chunk of data has been recieved, so append it to `str`
      response.on('data', function (chunk) {
        str += chunk;
      });

      //the whole response has been recieved, so we just print it out here
      response.on('end', function () {
        //console.log(str);
        var resultObj = JSON.parse(str);
        self.results = resultObj;
        self.emit('inserted', self.results);
      });
    }

    var req = http.request(options, callback);
    req.write(postData);
    req.end();

    return self;
}

