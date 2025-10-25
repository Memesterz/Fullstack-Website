const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/search',(req,res) => {
    const searchTerm = (req.query.query || "").trim();
    let results = []

    if (searchTerm) {
    const searchQuery = db.prepare(`
    SELECT
        users.username,
        users.id
    FROM users
    WHERE username LIKE ? ORDER BY username ASC
    `)
    results = searchQuery.all(`%${searchTerm}%`)
    console.log(results)
    }
    res.render('search/search',{results, query: searchTerm})
})

module.exports = router