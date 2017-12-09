const express = require('express');
const CookieStore = require('cookie-sessions');
const app = express();
const port = 2266;
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended:false});
const crypto = require('crypto');

app.use(express.static(__dirname+'/public'));
app.use(express.static(__dirname+'/user'));
app.use(CookieStore({secret:'day'}));

app.listen(port, function(err) {
    if(!err) console.log("Listening in port " + port);
});

// Please install npm package mysql first
const config = require('./config');
const mysql = require('mysql');

const connection = mysql.createConnection({
	host: 'localhost',
	user: config.mysql.user,
	password: config.mysql.password
});

connection.connect();

var fs = require('fs');//make new dir

//log in
app.post('/post',urlencodedParser, function(req, res) {  
  var useraccount = req.body.account;
  var userpassword = req.body.password;
  var md5 = crypto.createHash('md5');
  userpassword = md5.update(userpassword).digest('hex');//加密密碼
  var checkaccount = 0;
  var check = "SELECT * FROM `wp2017_groupc`.`user` WHERE account = ?";
  connection.query(check, [useraccount], function (err, rows, result){
    if (err){
      console.log("log in check failed!");
    }
    else{
      for(useraccount in rows){
        checkaccount = 1;
      }
    }
    if(checkaccount == 1){ 
      if(rows[useraccount].password == userpassword){
        req.session = {account:rows[useraccount].account};
        console.log("log in:" + rows[useraccount].account);
        res.redirect('home.html')
      }
      else res.send(`Your password is wrong`);
    }
    else{
      res.redirect('form_signup.html')
    }
  });
});

//sign up
var signup_account;
app.post('/post_signup',urlencodedParser, function(req, res) {  
  signup_account = req.body.account_signup;
  var signup_password = req.body.password_signup;
  var signup_passcheck = req.body.password_again;
  var samepass = 0;
  if(signup_password == signup_passcheck) samepass = 1;
  var md5 = crypto.createHash('md5');
  signup_password = md5.update(signup_password).digest('hex');//加密密碼
  var signup_email = req.body.email_signup;
  var insert = "INSERT INTO `wp2017_groupc`.`user` (account, password, email) VALUES(?,?,?)";
  var check_signup = "SELECT * FROM `wp2017_groupc`.`user` WHERE account = ?";
  var newaccount = 0;
  connection.query(check_signup, [signup_account], function (err, rows, result){
    if (err){
      console.log("sign up select failed");
    }
    else{
      for(signup_account in rows){
        newaccount = 1;
      }
    }
    if(newaccount == 0){
      if(samepass == 1){
        connection.query(insert,[signup_account, signup_password, signup_email], function (err, result){
          if (err){
            console.log("sign up insert failed");
          }
          else{
            res.redirect('person_info.html')
            console.log("sign up:" + signup_account);
          }
        });
      }
      else res.send(`Your password is wrong`);
    }
    else{
      res.send(`The account has already existed`);
    }
  });
});

//person_information
app.post('/post_info',urlencodedParser, function(req, res) {
  var p_account = signup_account;
  var p_birthday = req.body.p_birthday;
  var p_department = req.body.p_department;
  var p_hobby = req.body.p_hobby;
  var p_insert = "INSERT INTO `wp2017_groupc`.`person_information` (account, birthday, department, hobby) VALUES(?,?,?,?)";
  var p_select = "SELECT * FROM `wp2017_groupc`.`user` WHERE account = ?";
  var t=0;
  var tt;
  connection.query(p_insert, [p_account, p_birthday,p_department, p_hobby], function (err, result){
    if (err){
      console.log("person_info select failed");
    }
    else{
      connection.query(p_select, [p_account], function (err, rows, result){
        for(p_account in rows){
          req.session = {account:rows[p_account].account};
          console.log("person_info:" + req.session.account);
          res.redirect('home.html')
        }
      });
    }
  });
});
//facebook log in
app.post('/post_fb',urlencodedParser,function(req, res){
    console.log("in the post_fb");
    var fb_email =` ${req.body.email}`;   
    var fb_name =` ${req.body.name}`;
    console.log(fb_name);
    var insert = "INSERT INTO `wp2017_groupc`.`user_fb` (NAME, email) VALUES(?,?)"; 
    var checkaccount = 0;
    var check = "SELECT *FROM `wp2017_groupc`.`user_fb` WHERE email = ?";
    connection.query(check, [fb_email], function(err, rows, result){
        if (err){
            console.log("check failed");
        }
        else{
            for(fb_id in rows){
                checkaccount = 1;
                console.log("you have already been the user");
                //res.send("1")
            }
        }
        if(checkaccount == 0){
             connection.query(insert,[fb_name,fb_email], function (err, result){
                if (err){
                    console.log("insert failed!");
                }
                else{ 
                        console.log("1 account insert");
                        var dir = './user/'+fb_email;//make user dir
                        console.log("a new dir");
                        if(!fs.existsSync(dir)){
                            fs.mkdirSync(dir);
                        }
                        res.send("1");
                        
                    }
                });
        
        }
        else {
                console.log("already there!");
                var a="0";
                res.send(a);
        }
    });
});

//user name
app.post('/user',urlencodedParser, function(req,res){
  if (req.session == null) {
    res.send(null);
  }
  else {
    console.log("user session:" + req.session.account);
    res.send(req.session.account);
  }
});
//default user name
var first = 1;
app.post('/default',urlencodedParser, function(req,res){
  if (first) {
    first = 0;
    req.session = null;
    res.send("first visit");
  }
  else
    res.send("not first visit");
});

//logout
app.post('/logout',urlencodedParser, function(req,res){
  console.log("user logout:" + req.session.account);
  req.session = null;
  res.send(null);
});

//view more //when refresh the pages, how do we reload this?
var i = -1;
app.post('/view_more',urlencodedParser, function(req, res) {
  //var r = Math.floor((Math.random() * 6));
  var rand_pick = "SELECT account FROM `wp2017_groupc`.`person_information`";
  connection.query(rand_pick, (err,result) => { //checking function
    if (err) {
      throw err;
    }
    else {
      if (i <= 5) { // i <= array size
        //console.log(result);
        i=i+1;
        res.status(200).send(result[i].account);
      }
    }
  });
});


var fs1 = require('fs');
var busboy = require('connect-busboy');

app.use(busboy());

app.post('/upload', function(req, res){
    var fstream;
    //var dir = './user/'+fb_id;
    req.pipe(req.busboy);
    req.busboy.on('file', function (filedname, file, filename){
        console.log("Uploading: " +filename);
        fstream = fs1.createWriteStream(__dirname +'/user/'+ filename);
        console.log(fstream);
        file.pipe(fstream);
        fstream.on('close',function(){
            res.redirect('back');
        });
    });
    res.send(filename);
});

//get picture
//var path = require('path');

app.get('/show_pic', function(req, res){
  res.send('emma.jpg');
}); 

//選擇
/*
var sel = "SELECT * FROM `wp2017_groupc`.`user` WHERE account='0001'";
connection.query(sel, (err,result) => {//result?? yes!!
    if (err){
      console.log('selete failed!');
    }
    else{
      console.log("account: "+result);
      console.log(result);
    }
});
*/
//delete data in database
/*
var del = "DELETE FROM `wp2017_groupc`.`person_information` WHERE account = '0'";
connection.query(del, function (err, result) {
  if (err){
    console.log('delete failed!');
  }
  console.log("Number of records deleted: " + result.affectedRows);
});
*/
