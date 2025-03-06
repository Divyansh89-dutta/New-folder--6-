const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcrypt');
const path = require('path');
const jwt = require('jsonwebtoken');
const userModel = require('./models/user.model');

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

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
