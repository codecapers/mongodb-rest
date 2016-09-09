'use strict'; 

//
// Utils for testing.
//

var Promise = require('bluebird');
var mongo = Promise.promisifyAll(require('mongodb')).MongoClient;
var request = Promise.promisifyAll(require('request'));
var connection = require('../lib/connection');

//
// Drop the specified test database.
//
var dropDatabase = function (testDbName) {
    var url = 'mongodb://localhost:27017/' + testDbName;

    return mongo.connectAsync(url)
        .then(function(db) {
            return db.dropDatabaseAsync();
        });
};

//
// Save a document and return a promise.
// This is a workaround, can't seem to do achieve this using the save fn in promised-mongo.
var saveDocument = function (collection, document) {
    return collection.save(document);
};

//
// Load data into a db collection.
// 
var loadFixture = function (testDbName, testCollectionName, data) {    
    var url = 'mongodb://localhost:27017/' + testDbName;

    return mongo.connectAsync(url)
        .then(function(db) {
            return db.createCollectionAsync(testCollectionName);
        })
        .then(function(collection) {
            return Promise.all(data.map(function (dataItem) {
                return saveDocument(collection, dataItem);
            }));
        });
};

//
// Load data into a db collection.
// 
var dropDatabaseAndLoadFixture = function (testDbName, testCollectionName, data) {    
    return dropDatabase(testDbName)
        .then(function () {
            return loadFixture(testDbName, testCollectionName, data);
        });
};

//
// Request http document from the rest api.
//
var requestHttp = function (url) {
    return request.getAsync(url).then(function(response) {
        return { 
            data: response.body, 
            response: response,
        };
    });
};

//
// Request JSON from the rest api.
//
var requestJson = function (url) {
    return request.getAsync(url).then(function (response) {
        return {
            data: JSON.parse(response.body), 
            response: response,
        };
    });
};

//
// Get a collection and run expectations on it.
//
var collectionJson = function (url) {
    return requestJson(url);
};

//
// Get an item from the db and run expectations on it.
//
var itemJson = function (collectionUrl, itemID) {
    var itemUrl = collectionUrl + "/" + itemID.toString();
    return requestJson(itemUrl);
};

//
// Get the response for a db item.
//
var itemHttp = function (collectionUrl, itemID) {
    var itemUrl = collectionUrl + "/" + itemID.toString();
    return requestHttp(itemUrl);
};

//
// Invoke a HTTP PUT.
//
var post = function (url, data) {
    return request.postAsync({
            url: url, 
            json: true,
            body: data,
        })
        .then(function (response) {
            return { 
                data: response.body,
                response: response,
            };
        });
};

//
// Invoke a HTTP PUT.
//
var put = function (collectionUrl, itemID, data) {
    var itemUrl = collectionUrl + "/" + itemID.toString();
    return request.putAsync({
        url: itemUrl, 
        json: data,
    }).then(function (response) {
        return {
            data: response.body,
            response: response,
        }
    });
};

//
// Inovke a HTTP DELETE.
//
var del = function (collectionUrl, itemID) {
    var itemUrl = collectionUrl + "/" + itemID.toString();
    return request.delAsync({
        url: itemUrl, 
    }).then(function (response) {
        return {
            data: response.body,
            response: response
        };
    });
};

var nextCollectionNumber = 1;
var nextDbNumber = 1;
var url = 'http://localhost:3000/';
var dbsUrl = url + 'dbs';

var restServer = require('../server');

module.exports = {
    dropDatabaseAndLoadFixture: dropDatabaseAndLoadFixture,
    dropDatabase: dropDatabase,
    loadFixture: loadFixture,
    requestHttp: requestHttp,
    requestJson: requestJson,
    collectionJson: collectionJson,
    itemJson: itemJson,
    itemHttp: itemHttp,
    post: post,
    put: put,
    del: del,

    // Start the rest server.
    startServer: function (config) {
        // Open the rest server for each test.        
        return new Promise(function(resolve, reject) {
            restServer.startServer(config, function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    },

    stopServer: function () {
        restServer.stopServer();
        connection.closeAll();
    },

    genDbsUrl: function () {
        return dbsUrl;
    },

    genTestDbName: function () {
        return 'mongodb_rest_test' + nextDbNumber++;
    },

    genTestCollectionName: function () {
        return 'mongodb_test_collection' + nextCollectionNumber++;
    },

    genCollectionsUrl: function (dbName) { 
        return url + dbName;
    },

    genCollectionUrl: function (dbName, collectionName) {
        return this.genCollectionsUrl(dbName) + '/' + collectionName;
    },

};
    