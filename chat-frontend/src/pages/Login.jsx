import { useState } from "react";
import axios from "axios";
const API = import.meta.env.VITE_API_BASE_URL;
function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post(`${API}/api/auth/login`, form);

      console.log(" Login API Response:", res.data);

      const user = res.data.user;

      // Save EVERYTHING
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", user.id);

      localStorage.setItem("name", user.name);
      localStorage.setItem("email", user.email);

      console.log("💾 Saved to localStorage:", {
        token: res.data.token,
        userId: user._id,
        name: user.name,
        email: user.email,
      });

      window.location.href = "/channels";

    } catch (err) {
      console.log(" Login error:", err);
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Login</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          style={styles.input}
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button style={styles.button} type="submit">
          Login
        </button>
      </form>

      {message && <p style={styles.msg}>{message}</p>}
    </div>
  );
}

const styles = {
  container: {
    width: "350px",
    margin: "100px auto",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
  },
  button: {
    padding: "10px",
    backgroundColor: "#4A90E2",
    color: "#fff",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
  },
  msg: {
    marginTop: "15px",
    fontWeight: "bold",
  },
};

export default Login;
