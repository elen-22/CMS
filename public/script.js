// Frontend logic
let postList = document.querySelector("#postList");
let postForm = document.querySelector("#postForm");
let titleElement = document.querySelector("#title");
let contentElement = document.querySelector("#content");

document.addEventListener("DOMContentLoaded", () => {
    //later
    loadPosts(); // Load posts when the page loads

    postForm.addEventListener("submit", event => {
        event.preventDefault(); // Prevent page refresh

        let title = titleElement.value;
        let content = contentElement.value;

        if (!title || !content) {
            alert("Title and content cannot be empty!");
            return;
        }

        fetch("/add-post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content })
        })
            .then(res => res.json())
            .then(data => {
                titleElement.value = "";
                contentElement.value = "";
                loadPosts(); // Reload posts dynamically
            })
            .catch(err => console.error(" Error adding post:", err));
    });
});

//Function to load posts dynamically
function loadPosts() {
    fetch("/posts")
        .then(res => res.json())
        .then(posts => {
            console.log(posts)
            postList.innerHTML = posts.length
                ? posts.map(post =>
                    `<li>
                        <p>${post.title}</p>
                        <br>
                        <p>${post.content}</p>
                        <button class="deleteBtn" data-id="${post.id}">Delete</button>
                    </li>`
                ).join("")
                : "<p>No posts available.</p>";

            // Attach event listeners to delete buttons after posts are added
            document.querySelectorAll(".deleteBtn").forEach(button => {
                button.addEventListener("click", () => {
                    //later
                    deletePost(button.getAttribute("data-id"));
                });
            });
        })
        .catch(err => console.error("Error loading posts:", err));
}

// Function to delete a post
function deletePost(id) {
    if (confirm("Are you sure you want to delete this post?")) {
        fetch(`/delete-post?id=${id}`, { method: "DELETE" })
        //from backend we are getting success message which is a text thats why .text()
            .then(res => res.text())
            .then(data => { 
                location.reload() // Reload posts dynamically
            })
            .catch(err => console.error("Error deleting post:", err));
    }
}
