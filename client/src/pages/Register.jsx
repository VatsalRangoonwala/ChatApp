import { useState } from "react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    try {
      e.preventDefault();
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      login(data);
      toast.success(data?.message);
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        className="bg-white p-6 rounded shadow w-80"
        onSubmit={submitHandler}
      >
        <h2 className="text-xl font-bold mb-4 text-center">Register</h2>
        <input
          className="w-full border p-2 mb-3"
          placeholder="Name"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full border p-2 mb-3"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full border p-2 mb-4"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full bg-green-600 text-white py-2 rounded">
          Register
        </button>
        <p className="text-center mt-3 text-sm">
          Already have account?{" "}
          <Link className="text-green-600 ml-1" to="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
