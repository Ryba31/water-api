const express = require('express')
const serverless = require('serverless-http')
const cors = require('cors')
const {MongoClient} = require('mongodb')

const app = express()
app.use(cors())
app.use(express.json())

// Строка подключения из MongoDB Atlas (замени на свою)
const MONGODB_URI = 'mongodb+srv://ТВОЙ_ЛОГИН:ТВОЙ_ПАРОЛЬ@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority'

let cachedDb = null

async function connectToDatabase() {
    if (cachedDb) return cachedDb
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    cachedDb = client.db('watertracker') // Имя базы данных
    return cachedDb
}

const router = express.Router()

// Получить всех пользователей
router.get('/users', async (req, res) => {
    try {
        const db = await connectToDatabase()
        const users = await db.collection('users').find({}).toArray()
        res.json(users)
    } catch (e) {
        res.status(500).json({error: 'Ошибка базы данных'})
    }
})

// Зарегистрировать пользователя
router.post('/users', async (req, res) => {
    try {
        const db = await connectToDatabase()
        const newUser = req.body

        const existing = await db.collection('users').findOne({email: newUser.email})
        if (existing) {
            return res.status(400).json({error: 'Пользователь уже существует'})
        }

        newUser.id = Date.now()
        await db.collection('users').insertOne(newUser)
        res.status(201).json(newUser)
    } catch (e) {
        res.status(500).json({error: 'Ошибка базы данных'})
    }
})

app.use('/', router)

module.exports.handler = serverless(app)