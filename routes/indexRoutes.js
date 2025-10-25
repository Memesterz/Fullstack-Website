const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/',(req,res) => {
    let username = null
    const allPosts = db.prepare('SELECT * FROM blogs').all()
    if (req.user) {
        const userResult = db.prepare('SELECT users.username FROM users WHERE id = ?').get(req.user.userid)
        res.render('index', {user: req.user, allPosts,username: userResult})
    } else {
        res.render('index', { allPosts,username: null })
    }
})

module.exports = router