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

// Middleware Handling
const csrfMiddleware = require('./middleware/csrf')
const authMiddleware = require('./middleware/auth')

app.use(csrfMiddleware)
app.use(authMiddleware)
// Route Handling
const indexRoutes = require('./routes/indexRoutes')
const authRoutes = require('./routes/authRoutes')
const blogRoutes = require('./routes/blogRoutes')
const messageRoutes = require('./routes/messageRoutes')
const searchRoutes = require('./routes/searchRoutes')
const profileRoutes = require('./routes/profileRoutes')

app.use('/', indexRoutes)
app.use('/', authRoutes)
app.use('/', blogRoutes)
app.use('/', messageRoutes)
app.use('/', searchRoutes)
app.use('/', profileRoutes)

app.listen(PORT,() => {
    console.log(`Server started listening on PORT ${PORT}`)
})
