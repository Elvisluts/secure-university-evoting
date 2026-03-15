let token = localStorage.getItem("token") || "";

// Check if already logged in on page load
window.onload = function() {
    const role = localStorage.getItem("role");
    if (token && role) {
        document.getElementById("login-section").style.display = "none";
        if (role === "admin") {
            document.getElementById("admin-dashboard").style.display = "block";
        } else {
            document.getElementById("student-dashboard").style.display = "block";
            loadElections();
        }
    }
};

// LOGIN
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showMessage("Please enter both email and password", "error");
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.token) {
            token = data.token;
            localStorage.setItem("token", token);
            localStorage.setItem("role", data.user.role);

            document.getElementById("login-section").style.display = "none";
            showMessage("", "");

            if (data.user.role === "admin") {
                document.getElementById("admin-dashboard").style.display = "block";
            } else {
                document.getElementById("student-dashboard").style.display = "block";
                loadElections();
            }
        } else {
            showMessage(data.error || "Login failed", "error");
        }
    } catch (error) {
        showMessage("Network error: " + error.message, "error");
    }
}

// REGISTER
async function register() {
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;

    if (!name || !email || !password) {
        showMessage("Please fill all fields", "error");
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (data.message) {
            showMessage(data.message, "success");
            document.getElementById("reg-name").value = "";
            document.getElementById("reg-email").value = "";
            document.getElementById("reg-password").value = "";
        } else {
            showMessage(data.error || "Registration failed", "error");
        }
    } catch (error) {
        showMessage("Network error: " + error.message, "error");
    }
}

// LOGOUT
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    token = "";
    location.reload();
}

// ADMIN: Create Election
async function createElection() {
    const title = document.getElementById("election-title").value;
    const type = document.getElementById("election-type").value;
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;

    if (!title || !startDate || !endDate) {
        showAdminMessage("Please fill all fields", "error");
        return;
    }

    try {
        // FIXED: Changed from /api/elections to /api/elections/create
        const res = await fetch("http://localhost:5000/api/elections/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                title: title,
                type: type,
                start_date: startDate,
                end_date: endDate,
                is_active: true
            })
        });

        const data = await res.json();

        if (data.election || data.message) {
            showAdminMessage("Election created successfully!", "success");
            document.getElementById("election-title").value = "";
            document.getElementById("start-date").value = "";
            document.getElementById("end-date").value = "";
        } else {
            showAdminMessage(data.error || "Failed to create election", "error");
        }
    } catch (error) {
        showAdminMessage("Network error: " + error.message, "error");
    }
}

// ADMIN: Add Candidate
async function addCandidate() {
    const name = document.getElementById("candidate-name").value;
    const manifesto = document.getElementById("candidate-manifesto").value;
    const electionId = document.getElementById("candidate-election").value;

    if (!name || !electionId) {
        showAdminMessage("Name and Election ID are required", "error");
        return;
    }

    try {
        // FIXED: Changed from /api/candidates to /api/candidates/register
        const res = await fetch("http://localhost:5000/api/candidates/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                name: name,
                manifesto: manifesto,
                election_id: parseInt(electionId),
                photo_url: null
            })
        });

        const data = await res.json();

        if (data.candidate || data.message) {
            showAdminMessage("Candidate added successfully!", "success");
            document.getElementById("candidate-name").value = "";
            document.getElementById("candidate-manifesto").value = "";
            document.getElementById("candidate-election").value = "";
        } else {
            showAdminMessage(data.error || "Failed to add candidate", "error");
        }
    } catch (error) {
        showAdminMessage("Network error: " + error.message, "error");
    }
}

// STUDENT: Load Elections
async function loadElections() {
    try {
        const res = await fetch("http://localhost:5000/api/elections", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const elections = await res.json();
        const container = document.getElementById("elections");
        container.innerHTML = "";

        if (!elections || elections.length === 0) {
            container.innerHTML = "<p>No active elections available.</p>";
            return;
        }

        elections.forEach(election => {
            const div = document.createElement("div");
            div.className = "election-card";
            div.innerHTML = `
                <h3>${election.title}</h3>
                <p><strong>Type:</strong> ${election.type}</p>
                <p><strong>Period:</strong> ${new Date(election.start_date).toLocaleDateString()} - ${new Date(election.end_date).toLocaleDateString()}</p>
                <button onclick="loadCandidates(${election.id})">View Candidates</button>
                <div id="candidates-${election.id}" style="margin-top:10px;"></div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        document.getElementById("elections").innerHTML = "<p>Error loading elections: " + error.message + "</p>";
    }
}

// STUDENT: Load Candidates
async function loadCandidates(electionId) {
    const container = document.getElementById(`candidates-${electionId}`);
    
    if (container.innerHTML && container.style.display !== "none") {
        container.style.display = "none";
        return;
    }
    container.style.display = "block";

    try {
        // FIXED: Changed from /api/candidates/election/${electionId} to /api/candidates/${electionId}
        const res = await fetch(`http://localhost:5000/api/candidates/${electionId}`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const candidates = await res.json();

        if (!candidates || candidates.length === 0) {
            container.innerHTML = "<p>No candidates available for this election.</p>";
            return;
        }

        container.innerHTML = "";
        candidates.forEach(candidate => {
            const div = document.createElement("div");
            div.className = "candidate-card";
            div.innerHTML = `
                <b>${candidate.name}</b>
                <p>${candidate.manifesto || "No manifesto provided"}</p>
                <button onclick="vote(${electionId}, ${candidate.id})">Vote</button>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        container.innerHTML = "<p>Error loading candidates: " + error.message + "</p>";
    }
}

// STUDENT: Vote
async function vote(electionId, candidateId) {
    if (!confirm("Are you sure you want to vote for this candidate? This action cannot be undone.")) {
        return;
    }

    try {
        const res = await fetch("http://localhost:5000/api/votes/cast", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                election_id: electionId,
                candidate_id: candidateId
            })
        });

        const data = await res.json();

        let msgElement = document.getElementById("student-message");
        if (!msgElement) {
            msgElement = document.createElement("p");
            msgElement.id = "student-message";
            document.getElementById("student-dashboard").insertBefore(msgElement, document.getElementById("elections"));
        }

        if (data.message) {
            msgElement.innerText = data.message;
            msgElement.style.color = "green";
            loadElections();
        } else {
            msgElement.innerText = data.error || "Voting failed";
            msgElement.style.color = "red";
        }
    } catch (error) {
        alert("Network error: " + error.message);
    }
}

// Helper functions
function showMessage(msg, type) {
    const el = document.getElementById("message");
    el.innerText = msg;
    el.style.color = type === "success" ? "green" : "red";
}

function showAdminMessage(msg, type) {
    const el = document.getElementById("admin-message");
    el.innerText = msg;
    el.style.color = type === "success" ? "green" : "red";
}
