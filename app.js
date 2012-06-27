
var _ = require('underscore');
var express = require('express');
var mongo = require('mongodb');
var http = require('http');
var request = require('request');

var app = express.createServer();

app.get('/get', function(req, res) {
	res.send('get');
});

app.get('/put', function(req,res) {
	res.send("put");
});

app.listen(3100);