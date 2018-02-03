var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');

var BaseController = require('./baseController');
var dataset = require('./dataset');

var toolkit = require('./toolkit');
var assign = toolkit.assign;
var each = toolkit.each;
var pick = toolkit.pick;

app.use(bodyParser.json({type: 'application/*+json'}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

function formatRequest(request) {

    return {
        requestBody: request.body,
        queryParams: request.query,
        params: request.params
    };

}

function dataToResponse(data, response) {

    var status = data[0];
    var headers = data[1];
    var responseText = data[2];

    response
        .status(status)
        .set(headers)
        .json(responseText === '""' ? undefined : JSON.parse(responseText));

}

module.exports = function(options) {

    options = assign({port: 3000, resources: {}}, options);

    dataset.import(options.resources);

    each(options.resources, function(config, resourceType) {

        var ResourceController = BaseController.extend({
            resourceType: resourceType
        });

        var resourceController = new ResourceController(pick({}, config, ['filters', 'validationRules']));
        var resourceUrl = '/' + resourceType;

        // index
        app.get(resourceUrl, function(request, response) {
            dataToResponse(
                resourceController.list(formatRequest(request)),
                response
            );
        });

        // show
        app.get(resourceUrl + '/:id', function(request, response) {
            dataToResponse(
                resourceController.show(request.params.id, formatRequest(request)),
                response
            );
        });

        // create
        app.post(resourceUrl, function(request, response) {
            dataToResponse(
                resourceController.create(formatRequest(request)),
                response
            );
        });

        // Update
        ['put', 'post'].forEach(function(method) {

            app[method](resourceUrl + '/:id', function(request, response) {
                dataToResponse(
                    resourceController.edit(request.params.id, formatRequest(request)),
                    response
                );
            });

        });

        // delete
        app.delete(resourceUrl + '/:id', function(request, response) {
            dataToResponse(
                resourceController.delete(request.params.id, formatRequest(request)),
                response
            );
        });

    });

    if (options.beforeServerStart) {
        options.beforeServerStart(app);
    }

    app.listen(options.port);

};