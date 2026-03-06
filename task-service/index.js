const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');

const app = express();
const port = 3002;

app.use(bodyparser.json());

// Connect to MongoDB
mongoose.connect('mongodb://mongo:27017/tasks')
.then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("Failed to connect to MongoDB", err); 
});

const TaskSchema = new mongoose.Schema({
   task: String,
   description: String,
   userId: String,
   createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task',TaskSchema);

app.get('/', (req, res) => {
    res.send("Hello from Task Service!");
});

app.post('/tasks', async (req, res) => {
    try {
    const { userId, task, description } = req.body;
    const taskObj = new Task({ userId, task, description});
    await taskObj.save();
    res.status(201).json(taskObj);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create task' });
    }
})

app.get('/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }   
})

app.listen(port, () => {
    console.log(`Task Service is running on port ${port}`);
})  
