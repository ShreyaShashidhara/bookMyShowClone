import dotenv from 'dotenv';
import express from 'express';
import UserRoutes from './routes/user.route.js'; 
import TheatreRoutes from './routes/theatre.route.js';
import MovieRoutes from './routes/movie.route.js';
import BookingRoutes from './routes/booking.route.js';
import ShowRoutes from './routes/show.route.js';
import connectToDB from './database/mongoDb.js';
import cors from 'cors';
import nodemailer from 'nodemailer';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config({ path: './config/.env' });

const mailUser = process.env.GMAIL_USER;
const mailPass = process.env.GMAIL_APP_PASSWORD;

export const transporter = mailUser && mailPass
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: mailUser,
        pass: mailPass,
      },
    })
  : null;

if (!mailUser || !mailPass) {
  console.warn('Gmail credentials not configured. Email sending is disabled.');
}

const app = express();

app.set('view engine', 'ejs');

app.use(cors());

app.use(express.json());

// APIs
app.use('/api/user', UserRoutes);
app.use('/api/theatre', TheatreRoutes);
app.use('/api/movie', MovieRoutes);
app.use('/api/show', ShowRoutes);
app.use('/api/booking', BookingRoutes);


app.use((req, res) => {
  res.status(404).send("Page Not Found!");
});

const PORT = process.env.port || 5010;
// app.listen(PORT, () => {
//     console.log(`Server started at http://localhost:${PORT}`);
//     connectToDB();
// })

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: "http://localhost:3001"
    }
  });

io.on('connection', (socket) => {
    console.log(socket.id);
    socket.on('message', (msg) => {
        console.log(msg);
        io.emit('message', msg);
    })
    socket.on('message2', (msg) => {
        console.log(msg);
        io.emit('message2', msg);
    })
})

const startServer = async () => {
  try {
    await connectToDB();
    server.listen(PORT, () => {
      console.log(`Server started at http://localhost:${PORT}`);
    });
  } catch {
    console.error('Server startup aborted because MongoDB could not be reached.');
    process.exitCode = 1;
  }
};

startServer();