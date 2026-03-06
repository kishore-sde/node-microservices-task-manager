const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const amqp = require('amqplib');

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

let channel, connection;

async function connectRabbitMQWithretry(retryCount = 5, delay = 3000) {
    while (retryCount > 0) {
    try {
        connection = await amqp.connect('amqp://rabbitmq');
        channel = await connection.createChannel();
        await channel.assertQueue('task_created');
        console.log("Connected to RabbitMQ");
        return;
    } catch (err) {
        console.error("Failed to connect to RabbitMQ", err);  
        retryCount--;
        if (retryCount > 0) {
            console.log(`Retrying in ${delay / 1000} seconds... (${retryCount} attempts left)`);
            await new Promise(res => setTimeout(res, delay));
        } else {
            console.error("All retry attempts failed. Exiting.");
            process.exit(1);
        }  
    }
}
}

const Task = mongoose.model('Task',TaskSchema);

app.get('/', (req, res) => {
    res.send("Hello from Task Service!");
});

app.post('/tasks', async (req, res) => {
    try {
    const { userId, task, description } = req.body;
    const taskObj = new Task({ userId, task, description});
    await taskObj.save();

    const message = {taskId: taskObj._id, userId, task, description};
    if(!channel) {
        console.error("RabbitMQ channel is not available. Cannot send message.");
        return res.status(503).json({ error: 'Failed to send message to RabbitMQ' });
    } else {
        channel.sendToQueue('task_created', Buffer.from(JSON.stringify(message)));
        console.log("Sent message to RabbitMQ:", message);
    }

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
    connectRabbitMQWithretry();
})  
