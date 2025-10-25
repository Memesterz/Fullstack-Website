const express = require('express')
const router = express.Router()
const db = require('../db')

const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const sanitizeHTML = require("sanitize-html")

// LOGIN SYSTEM
// Get Login
router.get('/login',(req,res) => {
    res.render('auth/login')
})
// Post Login
router.post('/login',(req,res) => {
    let errors = []
    // Username Validation
    if (typeof req.body.username !== 'string') errors.push('Invalid Username')
    if (typeof req.body.password !== 'string') errors.push('Invalid Password')
    if (req.body.username.trim() === "") errors.push('No Username')
    if (req.body.password.trim() === "") errors.push('No Password')
    if (errors.length) return res.render('auth/login', { errors })
    // Username Check
    const userResult = db.prepare('SELECT * FROM users WHERE username = ?').get(req.body.username)
    if (!userResult) {
        errors.push('Incorrect Username/Password')
        return res.render('auth/login', { errors })
    }
    // Password Check
    const passValidation = bcrypt.compareSync(req.body.password, userResult.password)
    if (!passValidation) {
        errors.push('Incorrect Username/Password')
        return res.render('auth/login', { errors })
    }
    // Cookie Handler
    const loginToken = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        username: userResult.username,
        userid: userResult.id
    }, process.env.JWTSECRET)
    res.cookie('loginCookie', loginToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24
    })
    res.redirect('/')
})
// Get Logout
router.get("/logout",(req,res) => {
    res.clearCookie("loginCookie")
    res.redirect("/")
})
// REGISTERY SYSTEM
// Get Register
router.get('/register',(req,res) => {
    res.render('auth/register')
})
// Post Register
router.post('/register',(req,res) => {
    let errors = []

    // Username Validation
    if (typeof req.body.username !== "string") req.body.username = ""
    if (typeof req.body.password !== "string") req.body.password = ""
    if (!req.body.username) errors.push('Username Required')
    req.body.username = req.body.username.trim()
    if (req.body.username && req.body.username.length > 15) errors.push('Username cannot exceed 15 characters')
    if (req.body.username && req.body.username.length < 3) errors.push('Username must be at least 3 characters')
    if (req.body.username && !req.body.username.match(/^[a-zA-Z0-9]+$/)) errors.push('Username has invalid characters')

    // Taken Username Check
    const userResult = db.prepare('SELECT * FROM users WHERE username = ?').get(req.body.username)
    if (userResult) errors.push('Username Taken')
    // Password Validation
    if (!req.body.password) errors.push('Password Required')
    req.body.password = req.body.password.trim()
    if (req.body.password && req.body.password.length < 6) errors.push('Password must be at least 6 characters')
    if (req.body.password && req.body.password.length > 72) errors.push('Password cannot exceed 72 characters')
    if (req.body.password && !req.body.password.match(/^[a-zA-Z0-9]+$/)) errors.push('Password has invalid characters')
    if (req.body.password !== req.body.confirmpassword) errors.push('Passwords do not match')
    if (errors.length) {
        return res.render('auth/register', { errors })
    }
    // Password Encryption
    const salt = bcrypt.genSaltSync(10)
    req.body.password = bcrypt.hashSync(req.body.password, salt)
    // Account Creation
    const newUser = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(req.body.username, req.body.password)
    const user = db.prepare('SELECT users.username,users.id FROM users WHERE id = ?').get(newUser.lastInsertRowid)
    db.prepare('INSERT INTO profiles (profileid) VALUES (?)').run(newUser.lastInsertRowid)

    // Cookie Handling
    const registerToken = jwt.sign(
        {
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
            username: user.username,
            userid: user.id
        },
        process.env.JWTSECRET
    )
    res.cookie("loginCookie", registerToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24
    })
    res.redirect('/')
})

module.exports = router
