require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const pollRoutes = require("./router/polls")
const userRoutes = require("./router/user")
const cors = require('cors')
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
    next();
});
app.use('/api/polls', pollRoutes);
app.use('/api/user', userRoutes);
mongoose.connect(process.env.MONGO_URI).then(() => {
    app.listen(process.env.PORT_NO, () => {
        console.log(`Backend service listening on ${process.env.PORT_NO}`)
    })
}).catch((err) => {
    console.log("Failed to connect to database")
})
