const express = require('express')
const router = express.Router()
const db = require('../db')

const sanitizeHTML = require("sanitize-html")

router.get('/profile/:user',(req,res) => {
    const profile = db.prepare('SELECT * FROM profiles WHERE profileid = ?').get(req.params.user)
    const blogPost = db.prepare(`
    SELECT
        blogs.userid,
        blogs.title,
        blogs.body,
        users.username
    FROM blogs
    JOIN users ON blogs.userid = users.id
    WHERE username = ?
    `).all(req.params.user)
    const user = db.prepare('SELECT users.username,users.id FROM users WHERE id = ?').get(req.params.user)
    res.render('profile/profile',{user,blogPost,profile})
})

router.use((req, res, next) => {
  if (!req.user) return res.redirect('/')
  next()
})

router.get('/settings',(req,res) => {
    const profile = db.prepare('SELECT * FROM profiles WHERE profileid = ?').get(req.user.userid)
    res.render('profile/settings',{profile,user:req.user})
})

router.post('/profile/edit/status',(req,res) => {
    const profile = db.prepare('SELECT * FROM profiles WHERE profileid = ?').get(req.user.userid)
    if(!profile) return res.redirect('/')
    req.body.status = sanitizeHTML(req.body.status, {
        allowedTags: [],
        allowedAttributes: {}
    });
    db.prepare('UPDATE profiles SET status = ? WHERE profileid = ?').run(req.body.status, req.user.userid)

    res.redirect(`/profile/${req.user.userid}`);
})

router.post('/profile/edit/aboutme',(req,res) => {
    const profile = db.prepare('SELECT * FROM profiles WHERE profileid = ?').get(req.user.userid)
    if(!profile) return res.redirect('/')
    req.body.aboutme = sanitizeHTML(req.body.aboutme, {
        allowedTags: [],
        allowedAttributes: {}
    });
    db.prepare('UPDATE profiles SET aboutme = ? WHERE profileid = ?').run(req.body.aboutme, req.user.userid)

    res.redirect(`/profile/${req.user.userid}`);
})


module.exports = router