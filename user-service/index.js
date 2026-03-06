const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');

const app = express();
const port = 3001;

app.use(bodyparser.json());

// Connect to MongoDB
mongoose.connect('mongodb://mongo:27017/users')
.then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("Failed to connect to MongoDB", err); 
});

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
});

const User = mongoose.model('User',userSchema);

app.get('/', (req, res) => {
    res.send("Hello from User Service!");
});

app.post('/users', async (req, res) => {
    try {
    const { name, email} = req.body;
    const user = new User({ name, email});
    await user.save();
    res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create user' });
    }
})

app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }   
})

app.listen(port, () => {
    console.log(`User Service is running on port ${port}`);
})  
