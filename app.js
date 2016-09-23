var express = require('express');
var exphbs  = require('express-handlebars');

var app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get(['/', 'index'], function (req, res) {
    res.render('index', {
			title: "Soon"
		});
});

app.get('/create', function (req, res) {
    res.render('create', {
			title: "Create Countdown - Soon"
		});
});

app.get('/c/*', function (req, res) {
    res.render('detail');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
