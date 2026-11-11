const express = require('express')
const serverless = require('serverless-http')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

// База пользователей (в памяти)
let users = []

// Роутер для API
const router = express.Router()

// Получить всех пользователей
router.get('/users', (req, res) => {
    res.json(users)
})

// Зарегистрировать нового пользователя
router.post('/users', (req, res) => {
    const newUser = req.body

    if (users.find(u => u.email === newUser.email)) {
        return res.status(400).json({error: 'Пользователь уже существует'})
    }

    const user = {id: Date.now(), ...newUser}
    users.push(user)
    res.status(201).json(user)
})

// Подключаем роутер по пути /api/
// Подключаем роутер к корню функции.
// Если Netlify передал путь /api/users, Express не найдет его в роутере (там только /users),
// поэтому мы просто "срезаем" лишний /api, если он есть.
app.use((req, res, next) => {
    if (req.url.startsWith('/api/')) {
        req.url = req.url.replace('/api', '')
    }
    next()
})

app.use('/', router)

// Экспортируем как функцию для Netlify
module.exports.handler = serverless(app)