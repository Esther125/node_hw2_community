//建立資料庫連線
const mongo = require("mongodb");
const url = "mongodb+srv://root:root123@mycluster.top4n.mongodb.net/?retryWrites=true&w=majority"; 
const client = new mongo.MongoClient(url);
let db = null; 
client.connect(async function(err){
    if(err){
        console.log("database failed",err);
        return;
    }
    db = client.db("community");
    console.log("database success");
});

//建立網站伺服器基礎設定
const express = require("express");
const app = express();
const session = require("express-session");
app.use(session({
    secret:"anything",
    resave:false,
    saveUninitialized:true
}));
app.set("vew engine","ejs");
app.set("views","./views"); 
app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));
//建立首頁路由
app.get("/",async function(req,res){
    res.render("homepage.ejs");
});
//建立登入路由
app.post("/login",async function(req,res){
    const email = req.body.email;
    const password = req.body.password;
    const collection = db.collection("member");
    let result = await collection.findOne({
        $and:[
            {email:email},
            {password1:password}
        ]
    })
    if(result===null){
        res.redirect("/error?error=密碼或帳號錯誤");
        return;
    }
    //把登入會員存入session
    req.session.member = result;
    res.redirect("/member");
    
})
//建立member頁路由
app.get("/member",async function(req,res){
    //check是不是透過正常的login system進來的
    if(!req.session.member){
        res.redirect("/");
        return;
    }
    //show comments
    const collection2 = db.collection("comment");
    const name = req.session.member.name;
    const comment = req.query.comment;
    let comments =[];
    let result2 = await collection2.find({});
    await result2.forEach(function(comment){
        comments.push(comment);
    })
    res.render("login.ejs",{name:name,comment:comment,comments:comments});
})
//建立Error頁路由
app.get("/error",function(req,res){
    const error = req.query.error;
    res.render("error.ejs",{error:error});
})
//建立註冊路由
app.post("/create",async function(req,res){
    res.render("create.ejs");
})
//建立繳交註冊路由
app.post("/create-submit",async function(req,res){
    const collection =db.collection("member");
    const name = req.body.name;
    const email = req.body.email;
    const password1 = req.body.password1;
    const password2 = req.body.password2;
    let result = await collection.findOne({
        email:email
    })
    if(result!==null){
        res.redirect("/error?error=註冊失敗，此信箱已被註冊過");
        return;
    }else{
        if(password1===password2){
            let result2 = await collection.insertOne({
                name:name,
                email:email,
                password1:password1
            });
            res.redirect("/");
        }else{
            res.redirect("/error?error=請確認兩次輸入的密碼一致");
        }
    }
    
})
//建立送出留言路由
app.get("/login-comment",async function(req,res){
    if(!req.session.member){
        res.redirect("/");
        return;
    }
    const collection = db.collection("comment"); 
    const name = req.session.member.name;
    const comment = req.query.comment;
    var timestamp = new Date().getTime();
        let date = new Date(timestamp);
        const dateValues = [
            `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
        ];
    let result = await collection.insertOne({
        name:name,
        dateValues:dateValues,
        comment:comment
    })
    res.redirect("/member");
    return;

})
//建立登出路由
app.get("/logout",function(req,res){
    req.session.member = null;
    res.redirect("/");
    return;
})
//啟動伺服器 http://localhost:3000/
app.listen(3000,function(){
    console.log("server started");
});