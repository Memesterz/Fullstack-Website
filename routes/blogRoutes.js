const express = require('express')
const router = express.Router()
const db = require('../db')

const blogPost = db.prepare(`
    SELECT b.*, 
    u.id as userid,
    u.username as username
    FROM blogs b
    JOIN users u ON b.userid = u.id
    WHERE b.id = ?;
`)
function getPost(id) {
    const post = blogPost.get(id)
    if (!post) {
        console.log('No Post')
        return null
    }
    return post
}
// BLOG SYSTEM
router.get('/posts/:id',(req,res) => {
    const post = getPost(req.params.id)
    res.render('blogs/post', { post })
})

// POST DELETION SYSTEM
router.get('/posts/:id/delete',(req,res) => {
    // Post Validation
    const post = getPost(req.params.id)
    if (post?.userid !== req.user.userid) return res.redirect('/')
    res.render('blogs/delete',{post})
})

router.post('/posts/:id/delete',(req,res) => {
    // Post Validation
    const post = getPost(req.params.id)
    if (post?.userid !== req.user.userid) return res.redirect('/')
    // Post Deletion
    if(req.body.confirm == 'yes'){
        db.prepare('DELETE FROM blogs WHERE id = ?').run(req.params.id)
        return res.redirect('/')
    }else{
        return res.redirect(`/posts/${req.params.id}`)
    }
})

// POST EDIT SYSTEM
router.get('/posts/:id/edit',(req,res) => {
    // Post Validation
    const post = getPost(req.params.id)
    if (post?.userid !== req.user.userid) return res.redirect('/')
    res.render('blogs/create', { post })
})

router.post('/posts/:id/edit',(req,res) => {
    // Edit Validation
    const post = getPost(req.params.id)
    if (post?.userid !== req.user.userid) return res.redirect('/')
    // Edit Update
    db.prepare('UPDATE blogs SET title = ?, body = ? WHERE id = ?').run(req.body.title, req.body.body, req.params.id)
    res.redirect(`/posts/${req.params.id}`)
})

// POST CREATE SYSTEM
router.post('/create',(req,res) => {
    let errors = []
    // Body, and Title Validation
    if (typeof req.body.title !== 'string') errors.push('Invalid Title')
    if (typeof req.body.body !== 'string') errors.push('Invalid Body')
    if (req.body.title.trim() === '') errors.push('Title Required')
    if (req.body.body.trim() === '') errors.push('Body Required')
    req.body.title = sanitizeHTML(req.body.title, { allowedTags: [], allowedAttributes: {} })
    req.body.body = sanitizeHTML(req.body.body, { allowedTags: [], allowedAttributes: {} })
    if (errors.length) {
        return res.render('blogs/create', { errors })
    }
    // Post Creation
    const BlogPost = db.prepare('INSERT INTO blogs (userid, title, body) VALUES (?, ?, ?)').run(req.user.userid, req.body.title, req.body.body)
    res.redirect(`/post/${BlogPost.lastInsertRowid}`)
})

router.get('/create',(req,res) => {
    if (!req.user) return res.redirect('/')
    res.render('blogs/create',{post: {undefined}})
})

module.exports = router