import http from "http";
import path from "path";
import fs from "fs";

let currentDir = path.resolve();
let postsPath = path.join(currentDir, "posts.json");
let htmlPath = path.join(currentDir, "public/index.html");

let mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript"
};

function addPost(title, content) {
    return fs.promises.readFile(postsPath, "utf8")
        .then(data => JSON.parse(data || '[]')) 
        .catch(() => [])
        .then(posts => {
            let newPost = { id: Date.now(), title, content };
            posts.push(newPost);
            return fs.promises.writeFile(postsPath, JSON.stringify(posts, null, 2));
        })
        .then(() => console.log(`Post added: ${title}`))
        .catch(err => console.error(err.message));
}

function viewPosts(res) {
    return fs.promises.readFile(postsPath, "utf8")
        .then(data => JSON.parse(data || '[]'))
        .then(posts => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(posts));
        })
        .catch(err => {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Server Error");
            console.error(err);
        });
}

function deletePost(id, res) {
    return fs.promises.readFile(postsPath, "utf8")
        .then(data => JSON.parse(data || '[]'))
        .catch(() => [])
        .then(posts => {
            const postExists = posts.some(post => post.id === id);
            if (!postExists) {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Post not found");
                return;
            }

            let updatedPosts = posts.filter(post => post.id !== id);
            return fs.promises.writeFile(postsPath, JSON.stringify(updatedPosts, null, 2)) 
                .then(() => {
                    res.writeHead(200, { "Content-Type": "text/plain" });
                    res.end("Post deleted successfully");
                });
        })
        .catch(err => {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Server Error");
            console.error(err);
        });
}

function fileSender(req, res, next) {
    if (req.url === "/") {
        req.url = "/index.html";
    }
    let filePath = path.join(currentDir, `public/${req.url}`);
    let extName = path.extname(filePath);

    fs.promises.access(filePath)
        .then(() => {
            res.writeHead(200, { 'Content-Type': mimeTypes[extName] || "text-plain" }); 
            fs.createReadStream(filePath).pipe(res);
        })
        .catch(() => next());
}

const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/posts") {
        viewPosts(res);
    }
    else if (req.method === "POST" && req.url === "/add-post") {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                const { title, content } = JSON.parse(body);
                if (!title || !content) {
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    res.end("Title and content cannot be empty");
                    return;
                }

                addPost(title, content)
                    .then(() => {
                        res.writeHead(201, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ message: "Post added successfully!" }));
                    });
            } catch (error) {
                res.writeHead(400, { "Content-Type": "text/plain" });
                res.end("Invalid JSON format");
            }
        });
    }
    else if (req.method === "DELETE" && req.url.startsWith("/delete-post")) {
        //This extracts the id query parameter from the request URL.
        const id = new URL(req.url, `http://${req.headers.host}`).searchParams.get("id");
        if (!id) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Invalid request: Missing post ID");
            return;
        }
        deletePost(Number(id), res);
    }
    else {
        fileSender(req, res, () => {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 Not Found");
        });
    }
});


server.listen(3001);




// req.url = "/delete-post?id=123";
// req.headers.host = "localhost:3000";

// const url = new URL(req.url, `http://${req.headers.host}`);
// console.log(url.toString()); // "http://localhost:3000/delete-post?id=123"

// const id = url.searchParams.get("id");
// console.log(id); // "123"
