const http = require('http')
const url = require('url')

let users = []

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
    }

    const parsedUrl = url.parse(req.url, true)

    if (parsedUrl.pathname === '/api/users' && req.method === 'GET') {
        res.writeHead(200, {'Content-Type': 'application/json'})
        res.end(JSON.stringify(users))
        return
    }

    if (parsedUrl.pathname === '/api/users' && req.method === 'POST') {
        let body = ''
        req.on('data', chunk => {body += chunk.toString()})
        req.on('end', () => {
            try {
                const newUser = JSON.parse(body)
                if (users.find(u => u.email === newUser.email)) {
                    res.writeHead(400, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify({error: 'Пользователь уже существует'}))
                    return
                }
                const user = {id: Date.now(), ...newUser}
                users.push(user)
                res.writeHead(201, {'Content-Type': 'application/json'})
                res.end(JSON.stringify(user))
            } catch (e) {
                res.writeHead(400, {'Content-Type': 'application/json'})
                res.end(JSON.stringify({error: 'Неверный JSON'}))
            }
        })
        return
    }

    res.writeHead(404, {'Content-Type': 'application/json'})
    res.end(JSON.stringify({error: 'Not found'}))
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`)
})