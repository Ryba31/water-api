const express = require('express')
const serverless = require('serverless-http')
const cors = require('cors')
const {MongoClient} = require('mongodb')

const app = express()
app.use(cors())
app.use(express.json())

// ТВОЯ СТРОКА ПОДКЛЮЧЕНИЯ (замени ТВОЙ_ПАРОЛЬ на реальный пароль!)
const MONGODB_URI = 'mongodb+srv://rybden00_db_user:Kiker422@cluster0.q5srbxx.mongodb.net/?retryWrites=true&w=majority'

let cachedDb = null

async function connectToDatabase() {
    if (cachedDb) return cachedDb
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    cachedDb = client.db('watertracker')
    return cachedDb
}

const router = express.Router()

// --- ПОЛЬЗОВАТЕЛИ ---
router.get('/users', async (req, res) => {
    try {
        const db = await connectToDatabase()
        const users = await db.collection('users').find({}).toArray()
        res.json(users)
    } catch (e) {
        console.error(e)
        res.status(500).json({error: 'Ошибка базы данных'})
    }
})

router.post('/users', async (req, res) => {
    try {
        const db = await connectToDatabase()
        const newUser = req.body

        const existing = await db.collection('users').findOne({email: newUser.email})
        if (existing) {
            return res.status(400).json({error: 'Пользователь уже существует'})
        }

        newUser.id = Date.now()
        newUser.consumed = 0
        newUser.norm = 2000
        newUser.lastUpdated = new Date().toISOString()

        await db.collection('users').insertOne(newUser)
        res.status(201).json(newUser)
    } catch (e) {
        console.error(e)
        res.status(500).json({error: 'Ошибка базы данных'})
    }
})

// --- ВОДА ---
router.post('/water', async (req, res) => {
    try {
        const {email, amount} = req.body
        const db = await connectToDatabase()

        await db.collection('users').updateOne(
            {email: email},
            {
                $inc: {consumed: amount},
                $set: {lastUpdated: new Date().toISOString()}
            }
        )
        res.json({success: true})
    } catch (e) {
        console.error(e)
        res.status(500).json({error: 'Ошибка базы данных'})
    }
})

router.post('/reset-water', async (req, res) => {
    try {
        const {email} = req.body
        const db = await connectToDatabase()
        await db.collection('users').updateOne(
            {email: email},
            {$set: {consumed: 0, lastUpdated: new Date().toISOString()}}
        )
        res.json({success: true})
    } catch (e) {
        console.error(e)
        res.status(500).json({error: 'Ошибка базы данных'})
    }
})

// --- РЕЙТИНГ ---
router.get('/leaderboard', async (req, res) => {
    try {
        const db = await connectToDatabase()
        const users = await db.collection('users').find({}).toArray()

        const leaderboard = users.map(user => {
            const norm = user.norm || 2000
            const consumed = user.consumed || 0
            const percent = Math.min((consumed / norm) * 100, 100)
            return {
                name: user.name,
                email: user.email,
                consumed: consumed,
                norm: norm,
                percent: Math.round(percent)
            }
        }).sort((a, b) => b.percent - a.percent)

        res.json(leaderboard)
    } catch (e) {
        console.error(e)
        res.status(500).json({error: 'Ошибка базы данных'})
    }
})

// --- ОБНОВЛЕНИЕ НОРМЫ ---
router.post('/update-norm', async (req, res) => {
    try {
        const {email, norm} = req.body
        const db = await connectToDatabase()
        await db.collection('users').updateOne(
            {email: email},
            {$set: {norm: norm}}
        )
        res.json({success: true})
    } catch (e) {
        console.error(e)
        res.status(500).json({error: 'Ошибка базы данных'})
    }
})

// Эта прослойка нужна для работы на Netlify (убирает префикс /api)
app.use((req, res, next) => {
    if (req.url.startsWith('/api/')) {
        req.url = req.url.replace('/api', '')
    }
    next()
})

app.use('/', router)
module.exports.handler = serverless(app)