require('dotenv').config()

const express = require('express')
const app = express()
const PORT = 3000

const path = require('path');

const cookieParser = require("cookie-parser")

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }))
app.use(express.static("public"))
app.use(cookieParser())

const db = require('./db')

// --- Import middlewares ---
const csrfMiddleware = require('./middleware/csrf')
const authMiddleware = require('./middleware/auth')
// --- Apply middlewares ---
app.use(csrfMiddleware)
app.use(authMiddleware)
// --- Import routes ---
const indexRoutes = require('./routes/indexRoutes')
const authRoutes = require('./routes/authRoutes')
const blogRoutes = require('./routes/blogRoutes')
const messageRoutes = require('./routes/messageRoutes')
// --- Use routes ---
app.use('/', indexRoutes)
app.use('/', authRoutes)
app.use('/', blogRoutes)
app.use('/', messageRoutes)

// START SERVER
app.listen(PORT,() => {
    console.log(`Server started listening on PORT ${PORT}`)
})
