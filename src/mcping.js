import dgram from 'dgram';

export function mcPing(host, port = 19132, timeout = 5000) {
    return new Promise((resolve) => {
        const socket = dgram.createSocket('udp4');
        const start = Date.now();

        const packet = Buffer.alloc(35);

        // Bedrock RakNet Unconnected Ping
        packet.writeBigInt64BE(BigInt(Date.now()), 0);

        Buffer.from([
            0x00, 0xff, 0xff, 0x00,
            0xfe, 0xfe, 0xfe, 0xfe,
            0xfd, 0xfd, 0xfd, 0xfd,
            0x12, 0x34, 0x56, 0x78,
            0x00
        ]).copy(packet, 8);

        socket.on('message', (msg) => {
            const ping = Date.now() - start;

            socket.close();

            let text = msg.toString('utf8');

            if (text.startsWith('MCPE;')) {
                const data = text.split(';');

                resolve({
                    online: true,
                    ping,
                    motd: data[1] || 'Unknown',
                    protocol: data[2] || '?',
                    version: data[3] || '?',
                    players: data[4] || '0',
                    maxPlayers: data[5] || '0'
                });
            } else {
                resolve({
                    online: true,
                    ping,
                    motd: 'Minecraft Server',
                    protocol: '?',
                    version: '?',
                    players: '?',
                    maxPlayers: '?'
                });
            }
        });

        socket.on('error', () => {
            try {
                socket.close();
            } catch {}

            resolve({
                online: false
            });
        });

        socket.send(packet, 0, packet.length, port, host);

        setTimeout(() => {
            try {
                socket.close();
            } catch {}

            resolve({
                online: false
            });
        }, timeout);
    });
}
