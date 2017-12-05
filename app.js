var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var index = require('./routes/index');
var user = require('./routes/user');
var topic = require('./routes/topic');
var comment = require('./routes/comment');
var article = require('./routes/article');
var articleDraft = require('./routes/article-draft');
var privateMessage = require('./routes/private-message');

var mongoose = require('mongoose');
var uri = "mongodb://127.0.0.1:27017/thepowersouldb";
mongoose.connect(uri);
var db = mongoose.connection;

db.on('error',function(err){
    console.log('connection error', err);
});
db.once('openUri',function(){
    console.log('connected to database');
});

var app = express();
app.use(cookieParser());
app.use(cors());
// app.use(function(req, res, next) {
//    res.header("Access-Control-Allow-Origin", "*");
//    res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST');
//    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//    next();
// });
app.use(session({
   secret: 'thepowersoul-session', // 建议使用随机值
   cookie: ('name', 'value', {path: '/', httpOnly: true,secure: false, maxAge: 60000 }), // cookie保存时间
   resave: true,
   saveUninitialized: true
}));

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
app.get('/user/:user_id', user.getUserDetail);
app.get('/user-detail/:user_id/:target_id', user.getFollowingStatus);
app.get('/user-fav-topics/:user_id', user.getFavTopics);
app.get('/user-fav-articles/:user_id', user.getFavArticles);
app.put('/user-follow/:user_id/:target_id', user.addToFollowing);
app.put('/user-unfollow/:user_id/:target_id', user.removeFromFollowing);
app.put('/user-topic-fav/:user_id/:topic_id', user.addTopicToFav);
app.put('/user-article-fav/:user_id/:topic_id', user.addArticleToFav);
app.post('/login', user.login);
app.post('/signup', user.signUp);

// topic
app.post('/topic', topic.getTopics);
app.get('/topic/:user_id', topic.getUserTopics);
app.get('/topic/:user_id/:topic_id', topic.getTopicDetail);
app.post('/topic/:user_id', topic.addNewTopic);
app.put('/topic/:user_id/:topic_id/:operation_type', topic.likeOrDislike);
app.delete('/topic/:topic_id', topic.deleteTopic);

//comment
app.get('/comment/:topic_id', comment.getTopicComments);
app.post('/comment/:user_id/:topic_id', comment.addNewComment);
app.get('/comment/:user_id/:target_user_id/:context_id', comment.getConversation);
app.put('/comment/:user_id/:comment_id/:operation_type', comment.likeOrDislike);
app.delete('/comment/:comment_id', comment.deleteComment);

// article
app.get('/article/:article_id', article.getArticle);
app.get('/articles/:user_id', article.getUserArticles);
app.post('/article/:user_id', article.addNewArticle);
app.put('/article/:user_id/:article_id', article.likeTheArticle);
app.delete('/article/:article_id', article.deleteArticle);

// article draft
app.get('/article-draft/:article_draft_id', articleDraft.getArticleDraft);
app.get('/article-drafts/:user_id', articleDraft.getUserArticleDrafts);
app.post('/article-draft/:user_id', articleDraft.addNewArticleDraft);
app.put('/article-draft/:article_draft_id',articleDraft.updateArticleDraft);
app.delete('/article-draft/:article_draft_id', articleDraft.deleteArticleDraft);

// private message
app.get('/private-message/:user_id/:target_user_id', privateMessage.getUserMessageConversation);
app.get('/private-message/:user_id', privateMessage.getUserPrivateMessage);
app.put('/private-message/:user_id/:target_user_id', privateMessage.markReadBetweenTwoUsers);
app.put('/private-message/:user_id', privateMessage.markAllRead);
app.post('/private-message/:user_id/:target_user_id', privateMessage.sendPrivateMessage);
app.delete('/private-message/:user_id/:message_id', privateMessage.deleteMessage);

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
