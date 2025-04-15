document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    // Simulate login logic (replace with actual API call)
    if (email === "test@example.com" && password === "password123") {
      alert("Login successful!");
      window.location.href = "dashboard.html";
    } else {
      alert("Invalid email or password. Please try again.");
    }
  });
});