// simple chatting server with sse

// it is not a complete chat server
// some features are to be added and optimized

// importing required modules
import http from "http"
import fs from "fs"
import url from "url"

// monitoring the users
let users = []

// initializing the server
let server = http.createServer((req, res) => {

    // tracking the requested url
    console.log(req.url);

    // sending the chatting html file
    if (req.url == "/") {
        fs.readFile("./chat.html", (err, dat) => { res.end(dat) })
    }

    // getting message from the user
    if (req.url == "/message") {
        let data = ""
        req.on("data", ev => {
            data += ev.toString()
        })
        req.on("end", ev => {
            console.log(JSON.parse(data));
            let obj = JSON.parse(data)
            let flag = false
            for (let i in users) {

                // redirecting the message to the destination contact
                if (users[i].name == obj.to) {
                    users[i].res.write(`id:${obj.name}\ndata:${obj.msg}\n\n`)
                    flag = true
                }
            }
            if (flag) res.end("sent")
            else res.end("error occured")
        })

    }

    // arranging the SSE
    if (req.url.startsWith("/sse")) {
        res.setHeader("content-type", "text/event-stream")
        let obj = {
            res,
            name: url.parse(req.url, true, true).query.name
        }
        users.push(obj)

        // acknowledging that a new person is connected to the chat
        for (let i in users) {
            for (let j in users) {
                if (i == j) continue
                else {
                    users[i].res.write(`data:newUser ${users[j].name} connected\n\n`)
                }
            }
        }
        console.log(`users connected: ${users.length}`);

        // tracking the disconnected user
        req.on("close", ev => {
            let name = ""
            for (let i in users) {
                if (users[i].name == obj.name) {
                    console.log(`${users[i].name} is disconnected`);
                    name = users[i].name
                    users.splice(i, 1)

                }
            }

            // sending other users that someone is left
            for (let i in users) {
                users[i].res.write(`data:disconnected ${name}\n\n`)
            }
            console.log(`remaining users: ${users.length}`);
        })

    }

})

// server running on port 8080
server.listen(8080)