const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcrypt');
const path = require('path');
const jwt = require('jsonwebtoken');
const userModel = require('./models/user.model');
const tweetModel = require('./models/tweet.model');
const upload = require("./models/multer.model");

// Connect to MongoDB
require('./config/db.config');

// Middleware
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: "jansi-pagal-hai"
}));
app.use(flash());
app.use(express.static('public'));

// View Engine
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('login', { message: req.flash('error') });
});
app.post('/login', async (req, res) => {
    let { username, password } = req.body;
    let user = await userModel.findOne({ username });

    if (!user) {
        req.flash('error', 'User not found');
        return res.redirect('/');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        req.flash('error', 'Password is incorrect or incorrect username');
        return res.redirect('/');
    }

    let token = jwt.sign({ username }, 'jansi-pagal-hai', { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/profile');
});


app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    let { email, username, password } = req.body;
    let user = await userModel.findOne({ email });
    if (user) {
        req.flash('error', 'User already exists');
        return res.redirect('/signup');
    }
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async function (err, hash) {
            if (err) {
                req.flash('error', 'Error in password hashing');
                return res.redirect('/signup');
            }
            await userModel.create({
                email,
                username,
                password: hash
            });
            let token = jwt.sign({ username }, 'jansi-pagal-hai', { expiresIn: "1h" });
            res.cookie('jwt', token, { httpOnly: true });
            res.redirect('/');
        });
    });
});

app.get('/logout', (req, res) => {
    res.cookie('token', '');
    res.redirect('/');
});
app.get('/profile', isLoggedIn, async function(req, res){
    let user = await userModel.findOne({username: req.user.username});
    res.render('profile', {user});
})
function isLoggedIn(req, res, next){
    if(!req.cookies.token){
        req.flash('error', 'Please login to access this page');
        return res.redirect('/');
    }
    jwt.verify(req.cookies.token, 'jansi-pagal-hai', async function(err, decoded){
        if(err){
            req.flash('error', 'Please login to access this page');
            res.cookie('token', "");
            return res.redirect('/');
        }
        req.user = decoded;
        next();
    });
}

// function redirectTo(req, res, next){
//     if(req.cookies.token){
//         jwt.verify(req.cookies.token, 'jansi-pagal-hai', async function(err, decoded){
//             if(!err){
//                 res.cookie("token","");
//                 return next();
//             }
//             else{
//                 res.render("/login");
//             }

//         });
//     }
//     else{
//         return next();
//     }
// }
app.get('/edit', (req, res) => {
    res.render('edit');
});
// app.post('/upload', isLoggedIn, upload.single('profilePicture', "document"), async function(req, res){
//     let user = await userModel.findOne({username: req.user.username});
//     user.profilePicture = req.file.filename;
//     await user.save();
//     console.log(req.file.filename);
//     res.redirect('/profile',{userModel});
// })

app.post('/upload', isLoggedIn, upload.single('profilePicture'), async (req, res) => {
    let user = await userModel.findOne({ username: req.user.username });
    if (!user) return res.redirect('/profile');

    user.profilePicture = req.file.filename;
    await user.save();

    console.log("Uploaded File: ", req.file.filename);
    res.redirect('/profile');
});

app.get('/feed',isLoggedIn,async (req, res) => {
  let tweet = await tweetModel.find();
  let profilePicture = await userModel.findOne({ username:req.user.username });
  let user = await userModel.findOne({ username:req.user.username });
  res.render('feed', { tweet, profilePicture, user });
});

app.get('./createpost',isLoggedIn,async (req, res) =>{
    let user = await userModel.findOne({ username:req.user.username });
    res.render('createpost', { user });
})

app.post('/createpost',isLoggedIn,async (req, res) =>{
    let { tweet } = req.body;
    let user = await userModel.findOne({ username:req.user.username });
    await tweetModel.create({
        tweet,
        username: user.username,
        profilePicture: user.profilePicture
    });
    res.redirect('/feed');
})

app.post("/comment/id",isLoggedIn,async (req, res) =>{
    let { comment } = req.body;
    let user = await userModel.findOne({ username:req.user.username });
    let tweet = await tweetModel.findOne({ _id: req.params.id });
    tweet.comments.push({
        comment,
        username: user.username,
        createdAt: new Date()
    }); 
    await tweet.save();
    res.redirect('/feed');
}
)
app.get('/like/:id',isLoggedIn,async (req, res) =>{
    let tweet =  await tweetModel.findOne({ _id: req.params.id });
    if(!tweet.like.includes(req.user.username)){
        tweet.like.push(req.user.username);
        await tweet.save();
    }
    else{
        tweet.like = tweet.like.filter(like => like!== req.user.username);
        await tweet.save();
    }
    await tweet.save();
    res.redirect('/feed');
    })

    app.get('/delete/:id',isLoggedIn,async (req, res) =>{
        await tweetModel.findByIdAndDelete({ _id: req.params.id });
        res.redirect('/feed');
    })
// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});