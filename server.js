    // Create the application
var express = require('express');
var hash = require('./models/pass').hash;
var app = express();

    // Set static content to /public dir
var pub = __dirname + '/public';
app.use(express.static(pub));
app.use(express.bodyParser());
app.use(express.cookieParser('signature'));
app.use(express.session());
    // This pre-loads our routes.
app.use(app.router);

    // Configuration
app.use(express.errorHandler());
    // Not needed but nice to define.
app.set('views',__dirname + '/views');
    // Jade is easy.
app.set('view engine','jade');

    // Simple DB for testing
var users = {
    ryan: { name: 'ryan' },
    kate: { name: 'kate' }
}

    // Hashing, salting their password
hash('password',function(err,salt,hash){
    if (err) throw err;
    users.ryan.salt = salt;
    users.ryan.hash = hash;
});
hash('anotherpass',function(err,salt,hash){
    if (err) throw err;
    users.kate.salt = salt;
    users.kate.hash = hash;
});

function authenticate(name, pass, fn) {
   if (!module.parent) console.log('authenticating %s:%s', name, pass);
   var user = users[name];
   if (!user) return fn(new Error('cannot find user'));
   hash(pass, user.salt, function(err, hash){
      if (err) return fn(err);
      if (hash == user.hash) return fn(null, user);
      fn(new Error('invalid password'));
   });
}

function restrict(req, res, next) {
   if (req.session.user) {
      next();
   } else {
      req.session.error = 'Access denied!';
      res.redirect('/login');
   }
}

    // Redirect the root of the server to /index
app.get('/', function(req,res){
    res.redirect('/index');
});
    // Render the index page from /index
app.get('/index',restrict,function(req,res){
    res.render('index');
});

app.get('/logout', function(req, res){
  req.session.destroy(function(){
    res.redirect('/');
  });
});

app.get('/login', function(req, res){
  res.render('login');
});

app.post('/login', function(req, res){
  authenticate(req.body.username, req.body.password, function(err, user){
    if (user) {
      req.session.regenerate(function(){
        req.session.user = user;
        req.session.success = 'Authenticated as ' + user.name;
        res.redirect('/index');
      });
    } else {
      req.session.error = 'Authentication failed';
      res.redirect('/login');
    }
  });
});


    // Start the app on 3000
app.listen(3000);
console.log('Express started on port 3000');
