var config = require('./config.json');
var events = require('events');
module.exports = Wufoo;

function Wufoo() {
    events.EventEmitter.call(this);
}

Wufoo.super_ = events.EventEmitter;
Wufoo.prototype = Object.create(events.EventEmitter.prototype, {
    constructor: {
        value: Wufoo,
        enumerable: false
    }
});

Wufoo.prototype.getNewEntryCountAfter = function(lastEntryId) {
    var self = this;
    self.newEntryCount = 0;

    // Get the count.
    var https = require('https');

    var options = {
      host: config.wufoo_source.host,
      path: config.volunteers.wf_existing_entries_count_path.replace("{0}", lastEntryId),
      headers: {
         'Authorization': 'Basic ' + new Buffer(config.wufoo_source.api_key + ':footastic').toString('base64')
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
        var countObj = JSON.parse(str);
        self.newEntryCount = countObj.EntryCount;
        self.emit('counted', self.newEntryCount, lastEntryId);
      });
    }

    https.request(options, callback).end();

    return self;
}

Wufoo.prototype.getNewEntriesAfter = function(count, lastEntryId) {
    var self = this;
    self.newEntries = {};

    // Get the entries.
    var https = require('https');

    var options = {
      host: config.wufoo_source.host,
      path: config.volunteers.wf_existing_entries_path.replace("{0}", lastEntryId),
      headers: {
         'Authorization': 'Basic ' + new Buffer(config.wufoo_source.api_key + ':footastic').toString('base64')
       }
    };

    // Check if count is less than 100.
    callback = function(response) {
      var str = '';

      //another chunk of data has been recieved, so append it to `str`
      response.on('data', function (chunk) {
        str += chunk;
      });

      //the whole response has been recieved, so we just print it out here
      response.on('end', function () {
        //console.log(str);
        var entries = JSON.parse(str);
        self.newEntries = entries;
        self.emit('retrieved', self.newEntries);
      });
    }

    https.request(options, callback).end();

    return self;
}
