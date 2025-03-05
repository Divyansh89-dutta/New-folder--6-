const mongoose = require('mongoose');
// Connect to MongoDB
async function connectDB() {
    await mongoose.connect("mongodb://127.0.0.1:27017/jansi-twitter");
    console.log("Connected to MongoDB");
}
connectDB();
module.exports = mongoose.connection;