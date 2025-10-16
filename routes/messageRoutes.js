const express = require('express')
const router = express.Router()
const db = require('../db')

const sanitizeHTML = require("sanitize-html")

// Get Chat History
router.get('/chats',(req,res) => {
    if(!req.user) return res.redirect('/')
    // Select Chat History
    const chatHistory = db.prepare(`
    SELECT 
        chats.chatid,
        chats.senderid,
        chats.receiverid,
        CASE 
            WHEN chats.senderid = ? THEN receiver.username
            ELSE sender.username
        END AS chat_partner
    FROM chats
    JOIN users AS sender ON chats.senderid = sender.id
    JOIN users AS receiver ON chats.receiverid = receiver.id
    WHERE chats.senderid = ? OR chats.receiverid = ?`).all(req.user.userid,req.user.userid,req.user.userid)
    res.render('messages/messages', {chatHistory})
})
// Get Message History
router.get('/chats/:chatid',(req,res) => {
    if(!req.user) return res.redirect('/')
    // Messages Verification
    const chat = db.prepare(`
    SELECT * FROM chats
    WHERE chatid = ? AND (senderid = ? OR receiverid = ?)`).get(req.params.chatid, req.user.userid, req.user.userid);
    if (!chat) return res.status(403).send('Access Denied');
    // Get Messages
       const messages = db.prepare(`
    SELECT 
        messages.messageid,
        messages.content,
        messages.chatid,
        users.username AS sender_username
    FROM messages
    JOIN chats ON messages.chatid = chats.chatid
    JOIN users ON messages.senderid = users.id
    WHERE messages.chatid = ?
    `).all(req.params.chatid)
    res.render('messages/chat', {
        messages,
        username: req.user.username,
        chatid: req.params.chatid
    })
})
//Get Message Request System
router.get('/messageRequest',(req,res) => {
    if(!req.user) return res.redirect('/')
    const messageRequest = db.prepare(`
    SELECT 
        messageRequest.content,
        messageRequest.senderid,
        sender.username AS sender_username
    FROM messageRequest
    JOIN users AS sender ON messageRequest.senderid = sender.id
    JOIN users AS receiver ON messageRequest.receiverid = receiver.id
    WHERE receiverid = ?`).all(req.user.userid)
    res.render('messages/messageRequest',{messageRequest})
})
// Post Message Request System
router.post('/messageRequest',(req,res) => {
    if(!req.user) return res.redirect('/')
    // Select Message Request, and Request Verification
    const request = db.prepare(`
    SELECT
        messageRequest.receiverid,
        messageRequest.senderid,
        messageRequest.requestid,
        messageRequest.content,
    receiver.username
    FROM messageRequest
    JOIN users AS receiver ON messageRequest.receiverid = receiver.id
    JOIN users AS sender ON messageRequest.senderid = sender.id
    WHERE receiverid = ?`).get(req.user.userid)
    if(request.receiverid !== req.user.userid) return res.redirect('/')
    // Message Request Confirmation
    if(req.body.confirm == 'yes'){
    const result = db.prepare('INSERT INTO chats (senderid, receiverid) VALUES (?, ?)').run(request.senderid, request.receiverid)
    const newMessage = db.prepare('INSERT into MESSAGES (chatid,senderid,content) VALUES (?,?,?)')
    newMessage.run(result.lastInsertRowid,request.senderid,request.content)
    db.prepare('DELETE FROM messageRequest WHERE requestid = ?').run(request.requestid)
    return res.redirect(`/chats/${result.lastInsertRowid}`)
    }
    else{
    db.prepare('DELETE FROM messageRequest WHERE requestid = ?').run(request.requestid)
    return res.render('messages/chats')
    }
})
// Get New Message
router.get('/newMessage',(req,res) => {
    res.render('messages/newMessage')
})
// Post New Message
router.post('/newMessage',(req,res) => {
    if(!req.user) return res.redirect('/')
    let errors = []
    const target = db.prepare(`SELECT users.id,users.username FROM users WHERE username = ?`).get(req.body.username)
    // Verification
    if (typeof req.body.username !== 'string') errors.push('Invalid Username')
    if (typeof req.body.message !== 'string') errors.push('Invalid Message')
    if (req.body.username.trim() === '') errors.push('Username Required')
    if (req.body.message.trim() === '') errors.push('Message Required')
    if(target){
    // If Chat Exist Check
    const chatHistoryCheck = db.prepare(`
    SELECT chatid
    FROM chats
    WHERE (senderid = ? AND receiverid = ?)
    OR (senderid = ? AND receiverid = ?)
    LIMIT 1`).get(req.user.userid, target.id, target.id, req.user.userid)
    if(chatHistoryCheck){
        errors.push('Chat Already Exist')
        return res.render('messages/newMessage',{errors})
    }
    // Send Message
    db.prepare('INSERT INTO messageRequest (senderid,receiverid,content) VALUES (?,?,?)').run(req.user.userid,target.id,req.body.message)
    return res.redirect('/')
    }else{
    console.log('User Not Found')
    return res.redirect('/messages/newMessage')
    }
})
// Post Send Message
router.post('/sendMessage',(req,res) => {
    if(!req.user) return res.redirect('/')
    const previousUrl = req.get('Referer')
    const message = sanitizeHTML(req.body.sentMessage, {
    allowedTags: [],
    allowedAttributes: {}
    }).trim();
    // Send Message
    const chat = db.prepare('SELECT * FROM chats WHERE chatid = ? AND (senderid = ? OR receiverid = ?)').get(req.body.chatid, req.user.userid, req.user.userid);
    if (!chat) return res.status(403).send('Access Denied');
    db.prepare('INSERT INTO messages (senderid,chatid,content) VALUES (?,?,?)').run(req.user.userid,req.body.chatid,req.body.sentMessage)
    res.redirect(previousUrl);
})

module.exports = router