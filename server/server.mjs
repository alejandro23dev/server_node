import express from 'express';
import logger from 'morgan';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import cors from 'cors';
import connect from './dbconnect.mjs';

let db;

async function connectToDB() {
  db = await connect();
  console.log('Connected to database');
}

connectToDB();

const port = process.env.port ?? 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
	connectionStateRecovery: {}
	}
);

app.use(cors({
	origin: '*',
	credentials: true
  }));

  let userConnecteds= [];
  let userDisconnecteds= [];

io.on("connection", async (socket) => {
	
	const userID = socket.handshake.query.userID;

	if (!userConnecteds.includes(userID)) {
		const index = userDisconnecteds.indexOf(userID);
		if (index !== -1)
		  userDisconnecteds.splice(index, 1);

		userConnecteds.push(userID);
		io.emit('user-connecteds', userConnecteds);
	  }
  
	socket.on('disconnect', () => {
		if (userConnecteds.includes(userID)) {
			const index = userConnecteds.indexOf(userID);
			userConnecteds.splice(index, 1);

			userDisconnecteds.push(userID);
			io.emit('user-disconnecteds', userDisconnecteds);
		  }
  	});
  
  	socket.on('message', (msg, sent_userID, received_userID , sentDate) => {
		io.emit('message', msg, sent_userID, sentDate, 0);
		db.query(`INSERT INTO messages (message, sent_userID, received_userID, date ) VALUES (?, ?, ?, ?)`, 
			[msg, sent_userID, received_userID, sentDate]);
  	});

  
	socket.on('getMessages', async (sentUserID, contactUserID) => {

		try {
		  const [rows] = await db.execute(`SELECT * FROM messages WHERE (sent_userID = ? AND received_userID = ?) OR (sent_userID = ? AND received_userID = ?)`, [sentUserID, contactUserID, contactUserID, sentUserID]); 
		 
		  rows.forEach(row => {
			socket.emit('message', row.message, row.sent_userID, row.date, row.deleted);
		  });
			
		  console.log(rows);
		} catch (error) {

		  console.error(error);
		}
  
  	});

	socket.on('typing', (sentUserID, contactUserID) => {
	  io.emit('is-typing', `está escribiendo...`, sentUserID, contactUserID);
	});

	socket.on('stop-typing', (sentUserID) => {
	  io.emit('stop-typing', '', sentUserID);
	});
});

	app.use(logger('dev'))

	app.get('/', (req, res) => {
		res.send();
	  });

	server.listen(port, ()=>{
		console.log(`Servidor puerto ${port}`)
	})	

