var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var user = require('./routes/user');
var topic = require('./routes/topic');
var comment = require('./routes/comment');
var article = require('./routes/article');
var articleDraft = require('./routes/article-draft');
var privateMessage = require('./routes/private-message');

var app = express();

app.all('*', function(req, res, next) {
    // add details of what is allowed in HTTP request headers to the response headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', false);
    res.header('Access-Control-Max-Age', '86400');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    // the next() function continues execution and will move onto the requested URL/URI
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// user
app.use('/', index);
app.post('/users', user.getUsers);
app.get('/user-detail/:user_id/:target_id', user.getFollowingStatus);
app.post('/user-following/:user_id/:target_id', user.addToFollowing);
app.post('/login', user.login);
app.post('/signup', user.signUp);

// topic
app.get('/topic', topic.getTopics);
app.get('/topic/:user_id', topic.getUserTopics);
app.get('/topic/:user_id/:topic_id', topic.getTopicDetail);
app.post('/topic/:user_id', topic.addNewTopic);
app.delete('/topic/:topic_id', topic.deleteTopic);

//comment
app.get('/comment/:topic_id', comment.getTopicComments);
app.post('/comment/:target_context_id/:topic_id/:user_id/:targer_user_id', comment.addNewComment);
app.delete('/comment/:comment_id', comment.deleteComment);

// article
app.get('/article/:user_id', article.getUserArticles);
app.post('/article/:user_id', article.addNewArticle);
app.delete('/article/:article_id', article.deleteArticle);

// article draft
app.get('/article-draft/:user_id', articleDraft.getUserArticleDrafts);
app.post('/article-draft/:user_id', articleDraft.addNewArticleDraft);
app.delete('/article-draft/:article_draft_id', articleDraft.deleteArticleDraft);

// private message
app.post('/private-message/:user_id/', privateMessage.sendPrivateMessage);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
app.listen(3030);
