var MongoDB = require('../../db/mongodb');
var InfluxDB = require('../../db/influxdb');
var AppConstants = require('../../constants/AppConstants');
var path = require('path');
var cmd = require('node-cmd');
var crypto = require('crypto');

var jobTimers = {};

function Api(){};

Api.prototype.handleHTML = function(req, res) {
    res.sendFile(path.join(__dirname, '../../../', 'index.html'));
}

Api.prototype.handleUrlData = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "insertUrlData":
            new Api().insertUrlData(req, res);
            break;
        case "insertLoggedUserUrlData":
            new Api().insertLoggedUserUrlData(req, res);
            break;
        case "getUrlData":
            new Api().getUrlData(req, res);
            break;
        case "getLoggedUserUrlData":
            new Api().getLoggedUserUrlData(req, res);
            break;
        default:
            res.send("no data");
    }
}

Api.prototype.handleTestData = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "getTestData":
            res.send({'test': 'testdata'})
            break;
        default:
            res.send("no data");
    }
}

Api.prototype.insertUrlData = function(req, res) {
    var urlObj = req.body;
    var currentDate = new Date();
    var urlInsertObj = {
        ID: urlObj.hashID,
        url: urlObj.urlValue,
        dateTime: currentDate.toString(),
        status: 'New',
        resultUrl: ''
    };

    MongoDB.insertData(AppConstants.DB_URL_LIST, urlInsertObj, res, executeResultGenerator);
}

Api.prototype.insertLoggedUserUrlData = function(req, res) {
    var urlObj = req.body;
    var currentDate = new Date();
    var urlInsertObj = {
        ID: urlObj.hashID,
        url: urlObj.urlValue,
        dateTime: currentDate.toString(),
        status: 'New',
        resultUrl: '',
        userEmail: urlObj.userEmail
    };

    MongoDB.insertData(AppConstants.DB_URL_LIST, urlInsertObj, res, executeResultGenerator);
}

Api.prototype.getUrlData = function(req, res) {
    var urlObj = req.body;
    var queryObj = {ID: urlObj.hashID};
    MongoDB.fetchData(AppConstants.DB_URL_LIST, queryObj, res);
}

Api.prototype.getLoggedUserUrlData = function(req, res) {
    var urlObj = req.body;
    var queryObj = {
        userEmail: urlObj.userEmail,
        status: 'Done'
    };
    MongoDB.fetchData(AppConstants.DB_URL_LIST, queryObj, res);
}

function executeResultGenerator(collectionName, objectToInsert) {
    var siteName = objectToInsert.url.split('/')[2];
    var pathToResult = './sitespeed-result/' + siteName + '/' + objectToInsert.ID;
    // Send process request to sitespeed
    var commandStr = 'docker run --shm-size=1g --rm -v "$(pwd)":/sitespeed.io sitespeedio/sitespeed.io:7.2.1 --outputFolder ' + pathToResult + ' ' + objectToInsert.url;
    cmd.get(
        commandStr,
        function(err, data, stderr) {
            var newValueObj = {
                status: 'Done',
                resultUrl: pathToResult
            };
            MongoDB.updateData(collectionName, {ID: objectToInsert.ID}, newValueObj);
        }
    );
}

Api.prototype.handleJobs = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "insertJob":
            new Api().insertJob(req, res);
            break;
        case "removeJob":
            new Api().removeJob(req, res);
            break;
        case "getAllJobs":
            new Api().getAllJobs(req, res);
            break;
        case "startorStopJob":
            new Api().startorStopJob(req, res);
            break;
        default:
            res.send("no data");
    }
}

Api.prototype.insertJob = function(req, res) {
    var jobObj = req.body;
    var jobInsertObj = {
        jobId: jobObj.jobId,
        siteObject: {value: jobObj.siteObject.value},
        browser: jobObj.browser,
        scheduleDate: jobObj.scheduleDate,
        isRecursiveCheck: jobObj.isRecursiveCheck,
        recursiveSelect: jobObj.recursiveSelect,
        result: [],
        userEmail: jobObj.userEmail
    };

    MongoDB.insertData(AppConstants.DB_JOB_LIST, jobInsertObj, res, executeScheduleJob);
}

function executeScheduleJob(collectionName, insertedObject) {
    executeJob(collectionName, insertedObject);
}

Api.prototype.getAllJobs = function(req, res) {
    var userObj = req.body;
    var queryObj = {userEmail: userObj.userEmail};
    MongoDB.fetchData(AppConstants.DB_JOB_LIST, queryObj, res);
}

Api.prototype.removeJob = function(req, res) {
    var jobObj = req.body;
    var queryToRemoveJob = {
        jobId: jobObj.jobId
    };
    clearInterval(jobTimers[jobObj.jobId]);
    MongoDB.deleteOneData(AppConstants.DB_JOB_LIST, queryToRemoveJob, res);
}

Api.prototype.startorStopJob = function(req, res) {
    var jobObj = req.body.job;
    if (jobObj.recursiveSelect.isStart) {
        // Start the job
        jobTimers[jobObj.jobId] = setInterval(
            function() {
                //console.log("jobObj.jobId", jobObj.jobId)
                executeJob(AppConstants.DB_JOB_LIST, jobObj)
            },
            jobObj.recursiveSelect.value
        );
    } else {
        // Stop the job
        clearInterval(jobTimers[jobObj.jobId]);
    }

    var newValueObj = {
        recursiveSelect: jobObj.recursiveSelect
    };

    MongoDB.updateData(AppConstants.DB_JOB_LIST, {jobId: jobObj.jobId}, newValueObj);

    res.send(jobObj);
}

function executeJob(collectionName, objectToInsert) {
    var siteName = objectToInsert.siteObject.value.split('/')[2];
    var pathToResult = './sitespeed-result/' + siteName + '/' + objectToInsert.jobId;
    var resultID = crypto.randomBytes(10).toString('hex');
    //Send process request to sitespeed
    var commandStr = 'sudo docker run sitespeedio/sitespeed.io:7.3.6' +
        ' --influxdb.host 10.128.0.14 --influxdb.port 8086 --influxdb.database xsum' +
        ' --influxdb.tags "jobid=' + objectToInsert.jobId + ',resultID=' + resultID + '" ' + objectToInsert.siteObject.value;
    cmd.get(
        commandStr,
        function(err, data, stderr) {
            objectToInsert.result.push({resultUrl: pathToResult, executedDate: new Date()});
            var newValueObj = {
                result: objectToInsert.result
            };
            MongoDB.updateData(collectionName, {jobId: objectToInsert.jobId}, newValueObj);
        }
    );
}

Api.prototype.handleResults = function(req, res) {
    var action = req.query.action;
    switch (action) {
        case "getResult":
            new Api().getResult(req, res);
            break;
        default:
            res.send("no data");
    }
}

Api.prototype.getResult = function(req, res) {
    var resultObj = req.body;
    InfluxDB.getAllData("SELECT * FROM pageLoadTime where resultID='" + resultObj.resultID+ "'", res);
}

module.exports = new Api();
