const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/',(req,res) => {
    const allPosts = db.prepare('SELECT * FROM blogs').all()
    if (req.user) {
        res.render('index', { user: req.user, allPosts })
    } else {
        res.render('index', { allPosts })
    }
})

module.exports = router