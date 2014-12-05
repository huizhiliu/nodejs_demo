
/*
 * GET home page.
 */

var crypto = require('crypto'),
    fs   = require('fs'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');
module.exports = function(app) {

    app.get('/', function (req, res) {
        var page = req.query.p ? parseInt(req.query.p):1 ;
        Post.getTen(null, page,function (err, posts,total) {
            if (err) {
                posts = [];
            }
            res.render('index', {
                title: '主页',
                page:page,
                posts: posts,
                user:req.session.user,
                isFirstPage:(page-1) == 0,
                isLastPage:((page-1)*10 + posts.length) == total,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });


    app.get('/reg', checkNotlogin);
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });


    app.post('/reg', checkNotlogin);
    app.post('/reg', function (req, res) {


        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];

        if (password != password_re) {
            req.flash('error', '两次输入的密码不一致!');
        }


        //生成密码的md5值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: name,
            password: password,
            email: req.body.email
        });


        //检查用户名是否已经存在
        User.get(newUser.name, function (err, user) {
            if (user) {
                req.flash('error', '用户已存在！');
            }


            //如果用户不存在则新增用户
            newUser.save(function (err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = user;//用户信息存入session
                req.flash('success', '注册成功！');
                res.redirect('/');//注册成功返回主页
            });
        });
    });

    app.get('/login', checkNotlogin);
    app.get('/login', function (req, res) {
        res.render('login', {
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/login', checkNotlogin);
    app.post('/login', function (req, res) {

        //生成密码的md5值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        User.get(req.body.name, function (err, user) {
            if (!user) {
                req.flash('error', '该用户名不存在0.0');
                return res.redirect('/');
            }
            //检查密码是否一致
            if (user.password != password) {
                req.flash('error', '密码错误辣');
                return res.redirect('/');
            }
            //用户名密码匹配后存入session中
            req.session.user = user;
            req.flash('success', '登录成功');
            return res.redirect('/');//登录成功后跳转主页
        });
    });


    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        var currentUser = req.session.user,
            post = new Post(currentUser.name, req.body.title, req.body.post);
        post.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功!');
            res.redirect('/');//发表成功跳转到主页
        });
    });

    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '退出成功');
        res.redirect('/');
    });

    app.get('/upload', checkLogin);
    app.get('/upload', function (req, res) {
        res.render('upload', {
            title: '文件上传',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });


    app.post('/upload', checkNotlogin);
    app.post('/upload', function (req, res) {
        for (var i in req.files) {
            if (req.files[i].size == 0) {
                fs.unlinkSync(req.files[i].path);
                console.log('successful removed a file!');
            } else {
                var target_path = './pubilc/images' + req.file[i].path;
                fs.renameSync(req.file[i].path, target_path);
                console.log('successful rename a file!');
            }


        }
        req.flash('success', '上传成功');
        res.redirect('/upload');
    });


    app.get('/archive',function(req,res){
        Post.getArchive(function(err,posts){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('archive',{
                title:'存档',
                posts:posts,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()

            });
        });
    });


    app.get('/u/:name',function(req,res){

        var page = req.query.p ? parseInt(req.query.p):1;
        User.get(req.params.name,function(err,user){
            if(!user){
                req.flash('error','用户不存在');
                return  res.redirect('/');
            }
            //
            Post.getTen(user.name,page,function(err,posts,total){
                if(err){
                    req.flash('error','err');
                    return res.redirect('/');
                }
                res.render('user',{
                    title:user.name,
                    posts:posts,
                    page:page,
                    user:req.session.user,

                    isFirstPage : (page-1)==0,
                    isLastPage : ((page-1)*10+posts.length) == total,
                    success:req.flash('success').toString(),
                    error:req.flash('error').toString()
                });
            });
        });
    });

    app.get('/u/:name/:day/:title',function(req,res){
        Post.getOne(req.params.name,req.params.day,req.params.title,function(err,post){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('article',{
                title:req.params.title,
                post:post,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()

            });
        });
    });

    app.post('/u/:name/:day/:title',function(req,res){
        var date = new Date(),
            time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var comment = {
            name:req.body.name,
            email:req.body.email,
            website:req.body.website,
            time:time,
            content:req.body.content
        };
        var newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
        newComment.save(function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','留言成功');
            res.redirect('back');
        });
    });

    app.get('/edit/:name/:day/:title',checkLogin);
    app.get('/edit/:name/:day/:title',function(req,res){
        var currentUser = req.session.user;
        Post.edit(currentUser.name,req.params.day,req.params.title,function(err,post){

            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            res.render('edit',{
                title:'编辑',
                post:post,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        });
    });


    app.post('/edit/:name/:day/:title',checkLogin);
    app.post('/edit/:name/:day/:title',function(req,res){
        var currentUser = req.session.user;
        Post.update(currentUser.name,req.params.day,req.params.title,req.body.post,function(err){
            var url = '/u/'+req.params.name+'/'+req.params.day+'/'+req.params.title;
            if(err){
                req.flash('error',err);
                return res.redirect(url);
            }
            req.flash('success','修改成功');
            res.redirect(url);
        });
    });


    app.get('/remove/:name/:day/:title',checkLogin);
    app.get('/remove/:name/:day/:title',function(req,res){
        var currentUser = req.session.user;
        Post.remove(currentUser.name,req.params.day,req.params.title,function(err){
            if(err){
                req.flash('error','删除失败');
                return     res.redirect('back');
            }
            req.flash('success','删除成功');
            res.redirect('/');
        });
    });




    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '没登陆');
            res.redirect('/login');
        }
        next();
    };


    function checkNotlogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登录');
            res.redirect('back');
        }
        next();
    };
}
