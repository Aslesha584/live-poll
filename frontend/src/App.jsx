import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

function App() {
  const [page, setPage] = useState("home");
  const [pollId, setPollId] = useState("");
  const [poll, setPoll] = useState(null);

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Automatically open poll from shared link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedPollId = params.get("poll");

    if (sharedPollId) {
      loadPoll(sharedPollId);
    }
  }, []);

  // Load poll
  async function loadPoll(id) {
    if (!id) {
      setMessage("Please enter a Poll ID");
      return;
    }

    try {
      const res = await fetch(`${API}/polls/${id}`);

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Poll not found");
        return;
      }

      setPoll(data);
      setPollId(id);
      setPage("poll");
      setMessage("");
    } catch {
      setMessage("Cannot connect to server");
    }
  }

  // WebSocket realtime updates
  useEffect(() => {
    if (page !== "poll" || !pollId) return;

    const ws = new WebSocket(
      `ws://localhost:5000/api/polls/${pollId}/ws`
    );

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.votes) {
          setPoll((old) => ({
            ...old,
            votes: data.votes,
          }));
        }
      } catch {}
    };

    return () => ws.close();
  }, [page, pollId]);

  // Create poll
  async function createPoll() {
    if (!question.trim() || options.some((o) => !o.trim())) {
      setMessage("Please enter question and all options");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API}/polls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          options,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to create poll");
        return;
      }

      setPollId(data.pollId);

      setTimeout(() => {
        loadPoll(data.pollId);
      }, 300);
    } catch {
      setMessage("Server connection failed");
    } finally {
      setLoading(false);
    }
  }

  // Vote
  async function vote(index) {
    try {
      const res = await fetch(`${API}/polls/${pollId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          option: index,
        }),
      });

      if (!res.ok) {
        setMessage("Vote failed");
        return;
      }

      // Immediately refresh local result
      loadPoll(pollId);
    } catch {
      setMessage("Vote failed");
    }
  }

  // Signup
  async function signup() {
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      setMessage(data.message || data.error);

      if (res.ok) {
        setPage("login");
      }
    } catch {
      setMessage("Signup failed");
    }
  }

  // Login
  async function login() {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        setMessage("");
        setPage("create");
      } else {
        setMessage(data.error || "Login failed");
      }
    } catch {
      setMessage("Login failed");
    }
  }

  // HOME
  if (page === "home") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Live Poll</h1>

          <p style={styles.subtitle}>
            Create polls and see votes in real time.
          </p>

          <button
            style={styles.primary}
            onClick={() => setPage("create")}
          >
            Create Poll
          </button>

          <button
            style={styles.secondary}
            onClick={() => setPage("join")}
          >
            Join Poll
          </button>

          <div style={styles.links}>
            <button onClick={() => setPage("login")}>
              Login
            </button>

            <button onClick={() => setPage("signup")}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGIN
  if (page === "login") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Login</h2>

          <input
            style={styles.input}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={styles.primary} onClick={login}>
            Login
          </button>

          <p>{message}</p>

          <button onClick={() => setPage("home")}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // SIGNUP
  if (page === "signup") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Create Account</h2>

          <input
            style={styles.input}
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={styles.primary} onClick={signup}>
            Sign Up
          </button>

          <p>{message}</p>

          <button onClick={() => setPage("home")}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // CREATE
  if (page === "create") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Create Live Poll</h2>

          <input
            style={styles.input}
            placeholder="Enter your question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          {options.map((option, index) => (
            <input
              key={index}
              style={styles.input}
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => {
                const copy = [...options];
                copy[index] = e.target.value;
                setOptions(copy);
              }}
            />
          ))}

          <button
            style={styles.secondary}
            onClick={() => setOptions([...options, ""])}
          >
            + Add Option
          </button>

          <button
            style={styles.primary}
            onClick={createPoll}
          >
            {loading ? "Creating..." : "Create Poll"}
          </button>

          <p>{message}</p>

          <button onClick={() => setPage("home")}>
            ← Home
          </button>
        </div>
      </div>
    );
  }

  // JOIN
  if (page === "join") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Join Poll</h2>

          <input
            style={styles.input}
            placeholder="Paste Poll ID"
            value={pollId}
            onChange={(e) => setPollId(e.target.value)}
          />

          <button
            style={styles.primary}
            onClick={() => loadPoll(pollId)}
          >
            Join
          </button>

          <p>{message}</p>

          <button onClick={() => setPage("home")}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // POLL
  if (page === "poll" && poll) {
    const totalVotes = poll.votes.reduce(
      (a, b) => a + b,
      0
    );

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>{poll.question}</h2>

          <p style={styles.live}>
            ● LIVE RESULTS
          </p>

          {poll.options.map((option, index) => {
            const votes = poll.votes[index] || 0;

            const percentage =
              totalVotes === 0
                ? 0
                : Math.round(
                    (votes / totalVotes) * 100
                  );

            return (
              <div
                key={index}
                style={styles.optionBox}
              >
                <button
                  style={styles.optionButton}
                  onClick={() => vote(index)}
                >
                  {option}
                </button>

                <div style={styles.barBackground}>
                  <div
                    style={{
                      ...styles.bar,
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                <small>
                  {votes} votes — {percentage}%
                </small>
              </div>
            );
          })}

          <hr />

          <p>
            <b>Total votes:</b> {totalVotes}
          </p>

          <button
            style={styles.secondary}
            onClick={() => {
              const link =
                `${window.location.origin}/?poll=${pollId}`;

              navigator.clipboard.writeText(link);

              setMessage("Poll link copied!");
            }}
          >
            Copy Share Link
          </button>

          <p>{message}</p>

          <button onClick={() => setPage("home")}>
            ← Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f7fb",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
  },

  card: {
    width: "100%",
    maxWidth: "500px",
    background: "white",
    padding: "35px",
    borderRadius: "18px",
    boxShadow: "0 10px 35px rgba(0,0,0,0.1)",
  },

  title: {
    fontSize: "42px",
    marginBottom: "10px",
  },

  subtitle: {
    color: "#666",
    marginBottom: "30px",
  },

  input: {
    width: "100%",
    padding: "13px",
    margin: "8px 0",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxSizing: "border-box",
    fontSize: "15px",
  },

  primary: {
    width: "100%",
    padding: "13px",
    marginTop: "15px",
    background: "#111827",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
  },

  secondary: {
    width: "100%",
    padding: "13px",
    marginTop: "10px",
    background: "#eef2ff",
    color: "#111827",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
  },

  links: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "20px",
  },

  optionBox: {
    margin: "18px 0",
  },

  optionButton: {
    width: "100%",
    padding: "13px",
    background: "#f8fafc",
    border: "1px solid #ddd",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "16px",
  },

  barBackground: {
    height: "8px",
    background: "#e5e7eb",
    borderRadius: "10px",
    marginTop: "8px",
    overflow: "hidden",
  },

  bar: {
    height: "100%",
    background: "#111827",
    borderRadius: "10px",
    transition: "width 0.3s",
  },

  live: {
    color: "green",
    fontWeight: "bold",
  },
};

export default App;