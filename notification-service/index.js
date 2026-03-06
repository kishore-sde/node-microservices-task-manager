const amqp = require('amqplib');

let channel, connection;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq';
const QUEUE_NAME = 'task_created';
const RETRY_DELAY_MS = 5000;

async function start() {
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME);
        console.log("Notification Service listening for messages...");

        connection.on('error', (err) => {
            console.error("RabbitMQ connection error:", err.message);
        });

        connection.on('close', () => {
            console.error("RabbitMQ connection closed. Reconnecting...");
            setTimeout(start, RETRY_DELAY_MS);
        });

        channel.consume(QUEUE_NAME, (msg) => {
            if (msg !== null) {
                const task = JSON.parse(msg.content.toString());
                console.log("Received notification for new task:", task.task);
                console.log("Received notification for new task:", task);
                channel.ack(msg);
            }
        });

    } catch (err) {
        console.error("Failed to connect to RabbitMQ", err);
        setTimeout(start, RETRY_DELAY_MS);
    }

}

start();
