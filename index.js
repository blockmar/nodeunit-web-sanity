var http = require('http'),
    clone = require('clone-merge');

var Runner = function(config) {

    var options = {
        hostname: 'localhost',
        port: 3000,
        method: 'GET'
    };

    options = clone(options, config);

    var register_result = function(has_passed, message, urls, test) {
        test.ok(has_passed, message);
        if(urls.length == 0) {
            test.done();
        } else {
            check_next_url(urls, test);
        }
    };

    var check_next_url = function(urls, test) {

        var next_url = urls.pop();

        if (typeof next_url == 'string' || next_url instanceof String) {
            next_url = { path: next_url };
        }

        var req_options = clone(options, next_url);

        if(next_url.body) {
            req_options.headers = clone(req_options.headers || {}, {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Content-Length': next_url.body.length
            });
        }

        var req = http.request(req_options);

        req.on('error', function(err) {
            register_result(false, req_options.path + " Error: " + err.message, urls, test);
        });

        req.on('response', function(res) {
            if(res.statusCode >= 400) {
                register_result(false, req_options.path + " " + res.statusCode, urls, test);
            } else {
                res.on('data', function(){});
                res.on('end', function(){
                    register_result(true, req_options.path + " OK", urls, test);
                });
            }
        });

        if(next_url.body) {
            req.write(next_url.body);
        }

        req.end();
    };

    var pub_run = function(urls, test) {
        test.expect(urls.length);
        check_next_url(urls, test);
    };

    return {
        run: pub_run
    };
};

function sanity(config) {
    return sanity.runner(config);
}

sanity.runner = function (config) {
    return new Runner(config);
};

sanity.Runner = Runner;

module.exports = sanity;