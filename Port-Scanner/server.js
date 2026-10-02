const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const net = require('net');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));


function checkPort(host, port, timeout = 2000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let status = 'CLOSED';

        socket.setTimeout(timeout);

        socket.on('connect', () => {
            status = 'OPEN';
            socket.destroy();
        });

        socket.on('timeout', () => {
            status = 'TIMEOUT';
            socket.destroy();
        });

        socket.on('error', () => {
            status = 'CLOSED';
        });

        socket.on('close', () => {
            resolve({ port, status });
        });

        socket.connect(port, host);
    });
}

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

   
    socket.on('start-scan', async ({ host, startPort, endPort }) => {
        console.log(`Scanning ${host} from port ${startPort} to ${endPort}`);
        
        socket.emit('scan-status', { message: `Scanning started for ${host} (${startPort}-${endPort})...` });

        
        for (let port = parseInt(startPort); port <= parseInt(endPort); port++) {
            const result = await checkPort(host, port);
            
            if (result.status === 'OPEN') {
                socket.emit('port-result', { port: result.port, status: 'OPEN' });
            }
        }

        socket.emit('scan-status', { message: 'Scan completed!' });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Port Scanner server is running on http://localhost:${PORT}`);
});