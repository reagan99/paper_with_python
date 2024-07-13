const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const path = require('path');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server is running');
  });

app.post('/save-log', (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log("IP: ",clientIp);
    
    let { messages } = req.body;

    if (!Array.isArray(messages)) {
        messages = [messages];
    }

    const filePath = path.join(__dirname, 'logs', `${clientIp}.txt`);

    messages.forEach(message => {
        const logEntry = `Time: ${new Date().toISOString()}, Message: ${JSON.stringify(message)}\n`;
        fs.appendFile(filePath, logEntry, (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return res.status(500).send('Internal Server Error');
            }
        });
    });

    res.send('Log saved successfully');
});

const PORT = 8080;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
