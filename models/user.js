/**
 * Created by hui on 2014/11/13.
 */
var mongodb = require('./db');

function User(user){
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
};

module.exports = User;


User.prototype.save = function(callback){
    //存入数据库的用户文档
    var user = {
        name : this.name,
        password: this.password,
        email : this.email
    };
    //打开数据库
    mongodb.open(function(err,db){
        if(err){
            return callback(err);//错误，返回err信息
        }
        //读取users集合
        db.collection('users',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);//错误，返回err错误信息
            }
            collection.insert(user,{
                safe:true
            },function(err,user){
                mongodb.close();
                if(err){
                    return callback(err);//错误，返回err
                }
                callback(null,user[0]);//成功
            });
        });
    });

};


User.get = function(name,callback){   //查找是否存在该用户
    //打开数据库
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        //读取users集合
        db.collection('users',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);//错误返回err信息
            }
            //查找用户名（name键）值为name一个文档
            collection.findOne({
                name:name
            },function(err,user){
                mongodb.close();
                if(err){
                    return callback(err);//失败，返回err信息
                }
                callback(null,user);//成功！返回查询信息
            });
        });
    });
};