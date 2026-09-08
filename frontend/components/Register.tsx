import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { register, oauth42 } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await register(username, email, password);
      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message ?? "Registration failed");
      } else {
        alert("An unexpected error occurred");
      }
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#141817] px-4 py-8 font-sans text-[#f3f0e8]">
      <section className="w-full max-w-130 rounded-[22px] border border-[rgba(128,145,135,0.5)] bg-[rgba(22,28,27,0.92)] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.28)] max-sm:p-5">
        <p className="mb-2 text-[0.78rem] font-medium uppercase tracking-[0.12em] text-[#d8f36b]">
          Create account
        </p>
        <h1 className="mb-4 text-[clamp(2.4rem,6vw,4rem)] leading-none tracking-[-0.06em]">
          Register
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-[0.82rem] uppercase tracking-[0.04em] text-[#b7c2b9]">
              Username
            </span>
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-xl border border-[rgba(127,140,128,0.7)] bg-[rgba(14,18,17,0.9)] px-4 py-[0.9rem] text-[#f5f4ef] outline-none focus:border-[#d8f36b] focus:ring-4 focus:ring-[rgba(216,243,107,0.15)]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[0.82rem] uppercase tracking-[0.04em] text-[#b7c2b9]">
              Email
            </span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-[rgba(127,140,128,0.7)] bg-[rgba(14,18,17,0.9)] px-4 py-[0.9rem] text-[#f5f4ef] outline-none focus:border-[#d8f36b] focus:ring-4 focus:ring-[rgba(216,243,107,0.15)]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[0.82rem] uppercase tracking-[0.04em] text-[#b7c2b9]">
              Password
            </span>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-[rgba(127,140,128,0.7)] bg-[rgba(14,18,17,0.9)] px-4 py-[0.9rem] text-[#f5f4ef] outline-none focus:border-[#d8f36b] focus:ring-4 focus:ring-[rgba(216,243,107,0.15)]"
            />
          </label>

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-linear-to-br from-[#d8f36b] to-[#b4df38] px-4 py-[0.95rem] font-semibold text-[#111814] transition-transform hover:-translate-y-px"
          >
            Create account
          </button>
        </form>

        <button
          type="button"
          className="mt-4 w-full rounded-xl border border-[rgba(139,164,146,0.5)] bg-[rgba(94,111,100,0.25)] px-4 py-[0.95rem] font-semibold text-[#edf2eb] transition-transform hover:-translate-y-px"
          onClick={oauth42}
        >
          Continue with 42
        </button>

        <p className="mt-5 text-center text-[#c4cdc5]">
          Already a member?{" "}
          <Link className="text-[#d8f36b] no-underline" to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
};

export default Register;
