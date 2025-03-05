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
    res.render('login');
});

app.post('/login', async (req, res)=>{
    let {username, password} = req.body;
    let user = await userModel.findOne({username});
    if(!user){
        req.flash('error', 'User not found');
        return res.redirect('/');
    }
    bcrypt.compare(password, user.password, function(err, result){
        if(result){
            let token = jwt.sign({username}, 'jansi-pagal-hai');
            res.cookie('token', token);
            res.redirect('/');
        }else{
            req.flash('error', 'Password is incorrect or user not found');
            res.redirect('/');
        }
    })
})

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    let { email, username, password } = req.body;

    // Check if user already exists
    let user = await userModel.findOne({ email });
    if (user) {
        req.flash('error', 'User already exists');
        return res.redirect('/signup');
    }

    // Hash password and create user
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

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
