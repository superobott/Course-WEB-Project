document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const identifier = document.getElementById("userInput").value.trim();
    const password = document.getElementById("passInput").value;

    loginUser(identifier, password);
});

function loginUser(identifier, password) {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    console.log(users); 

    const userKey = Object.keys(users).find(key =>
        key === identifier || users[key].email === identifier
    );

    if (!userKey) {
        alert("User not found!");
        return;
    }

    const user = users[userKey];
    console.log(user.password); 
    console.log(btoa(password)); 

    if (user.password !== btoa(password)) {
        alert("Incorrect password!");
        return;
    }

    localStorage.setItem('loggedInUser', JSON.stringify(user));
    alert("Login successful!");
    window.location.href = "index.html";
}
