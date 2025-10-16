const Database = require('better-sqlite3')
const db = new Database('app.db')

db.pragma("journal_mode = wal")

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS blogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userid INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    FOREIGN KEY (userid) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chats (
    chatid INTEGER PRIMARY KEY AUTOINCREMENT,
    senderid INTEGER NOT NULL,
    receiverid INTEGER NOT NULL,
    FOREIGN KEY (senderid) REFERENCES users(id),
    FOREIGN KEY (receiverid) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    messageid INTEGER PRIMARY KEY AUTOINCREMENT,
    senderid INTEGER NOT NULL,
    chatid INTEGER NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY (senderid) REFERENCES users(id),
    FOREIGN KEY (chatid) REFERENCES chats(chatid)
  );

  CREATE TABLE IF NOT EXISTS messageRequest (
    requestid INTEGER PRIMARY KEY AUTOINCREMENT,
    senderid INTEGER NOT NULL,
    receiverid INTEGER NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY (senderid) REFERENCES users(id),
    FOREIGN KEY (receiverid) REFERENCES users(id)
  );
`)

module.exports = db