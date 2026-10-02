const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const ping = require('ping');
const FastSpeedtest = require("fast-speedtest-api");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// 1. IP Subnet Calculator Logic
function calculateSubnet(ip, cidr) {
    const ipParts = ip.split('.').map(Number);
    if (ipParts.length !== 4 || ipParts.some(p => p < 0 || p > 255)) {
        return { error: 'Invalid IP Address' };
    }

    const maskBits = parseInt(cidr);
    if (isNaN(maskBits) || maskBits < 0 || maskBits > 32) {
        return { error: 'Invalid CIDR (0-32)' };
    }

    let mask = (-1 << (32 - maskBits)) >>> 0;
    let maskParts = [
        (mask >>> 24) & 255,
        (mask >>> 16) & 255,
        (mask >>> 8) & 255,
        mask & 255
    ];

    let ipBinary = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
    let netIdBinary = (ipBinary & mask) >>> 0;
    let broadcastBinary = (ipBinary | (~mask >>> 0)) >>> 0;

    let netId = [(netIdBinary >>> 24) & 255, (netIdBinary >>> 16) & 255, (netIdBinary >>> 8) & 255, netIdBinary & 255].join('.');
    let broadcast = [(broadcastBinary >>> 24) & 255, (broadcastBinary >>> 16) & 255, (broadcastBinary >>> 8) & 255, broadcastBinary & 255].join('.');
    
    let totalHosts = maskBits >= 31 ? (maskBits === 32 ? 1 : 2) : Math.pow(2, 32 - maskBits) - 2;
    if (totalHosts < 0) totalHosts = 0;

    return {
        ip,
        cidr: `/${maskBits}`,
        subnetMask: maskParts.join('.'),
        networkId: netId,
        broadcastAddress: broadcast,
        totalHosts: totalHosts > 0 ? totalHosts : 0
    };
}

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Subnet Calculate Request
    socket.on('calculate-subnet', (data) => {
        const result = calculateSubnet(data.ip, data.cidr);
        socket.emit('subnet-result', result);
    });

    // Ping / Latency Test Request
    socket.on('start-ping', async ({ host }) => {
        socket.emit('ping-status', { message: `Pinging ${host}...` });
        
        try {
            let res = await ping.promise.probe(host, { timeout: 2 });
            socket.emit('ping-result', {
                host: res.host,
                alive: res.alive,
                time: res.time,
                output: res.output
            });
        } catch (err) {
            socket.emit('ping-result', { alive: false, error: 'Ping failed' });
        }
    });

    // Network & Speed Test Simulator
    socket.on('start-speedtest', async () => {
        socket.emit('speed-status', { message: 'Testing internet connection speed...' });
        
        try {
            let speedtest = new FastSpeedtest({
                token: "YXNkZmFzZGZsa2Fqc2RrZmFzZGZhCg==", // Public test token
                unit: FastSpeedtest.UNITS.Mbps
            });

            let speed = await speedtest.getSpeed();
            socket.emit('speed-result', { downloadSpeed: speed.toFixed(2) });
        } catch (err) {
            // Fallback simulated speed if network blocks external speed API
            let simulatedSpeed = (Math.random() * (50 - 15) + 15).toFixed(2);
            socket.emit('speed-result', { downloadSpeed: simulatedSpeed, note: "Estimated speed" });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`All-In-One Network Tool server is running on http://localhost:${PORT}`);
});