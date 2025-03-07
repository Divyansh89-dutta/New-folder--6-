const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
    tweet:{
        type: String,
        required: true
    },
    username:{
        type: String,
        required: true
    },
    like:{
        type: [String],
        default: []
    },
    profilePicture:{
        type: String,
        default: "default.png"
    },
    comments:[{
        comment:String,
        username:String,
        createdAt:Date
    }],
    postPicture:{
        type: String,
        default: "default.png"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Tweet', tweetSchema);