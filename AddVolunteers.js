var newVolunteer = require('./volunteer.json');
//console.log(newVolunteer);
var mapFile = require('./VolunteerFieldMap.json');
var map = {};
for (var field in mapFile.Fields) {
  map[mapFile.Fields[field].ID] = mapFile.Fields[field].DbField;
}
//console.log(map);

var events = require('events');

var Couch = require('./couch.js');
var couch = new Couch();
var lastEntryId = couch.getLastVolunteerEntry();
lastEntryId.on('found', function(entryId) {
  console.log('Max Wufoo ID in database: ' + entryId);
  var Wufoo = require('./wufoo.js');
  var wufoo = new Wufoo();
  var newEntryCount = wufoo.getNewEntryCountAfter(entryId);
  newEntryCount.on('counted', function(count, entryId) {
    console.log('Wufoo entries with newer ID: ' + count);
    docs = [];
    // Get the list of entries.
    var newEntries = wufoo.getNewEntriesAfter(count, entryId);
    newEntries.on('retrieved', function(entries) {
      console.log('Wufoo entries retrieved: ' + entries.Entries.length);
      // Add convert and add the entries to the database.
      for (var eId in entries.Entries) {
        var entry = entries.Entries[eId];
        var doc = JSON.parse(JSON.stringify(newVolunteer))
        for (var field in entry) {
          if (entry.hasOwnProperty(field)) {
            if (map[field]) {
              var docKeys = map[field].split(".");
              if (docKeys.length === 2) {
                doc[docKeys[0]][docKeys[1]] = entry[field];
              } else {
                doc[map[field]] = entry[field];
              }
            }
          }
        }
        // Add additional DB field data.
        docs.push(doc);
      };
      console.log('Database docs to insert: ' + docs.length);
      var dbResults = couch.insertDocs({ "docs": docs });
      dbResults.on('inserted', function(results) {
        console.log('Database docs inserted: ' + results.length);
      });
    });
  });
});
