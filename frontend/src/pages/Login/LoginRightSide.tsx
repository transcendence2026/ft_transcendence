import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Mail from "@/components/Elements/Mail";
import Lock from "@/components/Elements/Lock";
import EyeOpen from "@/components/Elements/EyeOpen";
import EyeClose from "@/components/Elements/EyeClose";
import Arrow from "@/components/Elements/Arrow";

export default function LoginRightSide() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, oauth42 } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message ?? "Login failed");
      } else {
        alert("An unexpected error occurred");
      }
    }
  };
  return (
    <section className="flex h-full flex-col bg-[#141312] px-6 py-6 sm:px-10 lg:px-16">
      <nav className="flex items-center justify-between pb-4 text-xs text-[#e0bfb7]">
        <Link to="#" className="transition-colors hover:text-[#ffb4a1]">
          ← Back to tasting notes
        </Link>
        <span className="hidden sm:block">
          New collector?{" "}
          <Link
            to="/register"
            className="font-semibold text-[#ffb4a1] underline decoration-[#ffb4a1]/30 transition-colors hover:decoration-[#ffb4a1]"
          >
            Request invitation
          </Link>
        </span>
      </nav>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#2b2a28] text-xl text-[#fabc4d] shadow-sm">
          É
        </div>
        <h1 className="text-3xl font-normal tracking-[-0.04em] text-[#e6e1df] sm:text-4xl">
          Welcome back, epicure.
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#a88a83]">
          Access your sommelier cellar locks, private dining vaults, and chef
          residency reservations.
        </p>

        <div className="mt-5">
          <button
            type="button"
            onClick={oauth42}
            className="flex h-10 w-full items-center justify-center gap-2 rounded bg-[#1d1b1a] font-sans text-[13px] font-medium text-[#e6e1df] transition-colors hover:bg-[#2b2a28]"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded bg-[#ffb4a1] text-xs font-bold text-[#141312]">
              42
            </span>
            Continue with 42
          </button>
        </div>

        <div className="my-5 flex items-center gap-4 text-center font-sans text-[10px] font-semibold uppercase tracking-widest text-[#a88a83]">
          <hr className="flex-1 border-[#2b2a28]" />
          or continue with email
          <hr className="flex-1 border-[#2b2a28]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <label className="block font-sans text-xs text-[#e0bfb7]">
            <span className="mb-1 block">Registered Account</span>
            <div className="flex h-10 items-center rounded bg-[#1d1b1a] px-3 transition-all">
              <Mail />
              <input
                type="email"
                placeholder="sommelier@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-none font-serif text-[14px] text-[#e6e1df] outline-none placeholder:text-[#a88a83]/50"
              />
            </div>
          </label>

          <label className="block font-sans text-xs text-[#e0bfb7]">
            <div className="mb-1 flex justify-between">
              <span>Passphrase</span>
              <Link
                to="#forgot"
                className="text-[#ffb4a1] transition-colors hover:text-[#ff7955]"
              >
                Forgot password?
              </Link>
            </div>
            <div className="flex h-10 items-center rounded bg-[#1d1b1a] px-3 transition-all">
              <Lock />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent font-serif text-[14px] tracking-widest text-[#e6e1df] outline-none placeholder:tracking-normal placeholder:text-[#a88a83]/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#a88a83] transition-colors hover:text-[#e0bfb7]"
              >
                {showPassword ? <EyeOpen /> : <EyeClose />}
              </button>
            </div>
          </label>

          <label className="flex w-full cursor-pointer items-center gap-2 py-1 font-sans text-xs text-[#e0bfb7] transition-colors hover:text-[#e6e1df]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-3.5 w-3.5 cursor-pointer rounded border-[#2b2a28] accent-[#ef6540] bg-[#1d1b1a]"
            />
            Remember this device for 30 days
          </label>

          <button
            type="submit"
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded bg-[#ef6540] font-sans text-[13px] font-semibold text-[#141312] shadow-lg transition-all hover:bg-[#ff7955] hover:shadow-[#ef6540]/20"
          >
            Sign In
            <Arrow />
          </button>
        </form>
      </div>

      <footer className="mt-auto flex items-center justify-center gap-4 pt-4 font-sans text-[11px] text-[#a88a83]">
        <Link to="#" className="hover:text-[#e0bfb7]">
          Terms of Dining
        </Link>
        <span className="h-1 w-1 rounded-full bg-[#363433]"></span>
        <Link to="#" className="hover:text-[#e0bfb7]">
          Privacy Charter
        </Link>
      </footer>
    </section>
  );
}
