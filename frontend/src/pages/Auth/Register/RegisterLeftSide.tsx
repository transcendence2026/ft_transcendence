import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import Mail from "@/src/components/Elements/Mail";
import Lock from "@/src/components/Elements/Lock";
import Arrow from "@/src/components/Elements/Arrow";
import EyeOpen from "@/src/components/Elements/EyeOpen";
import EyeClose from "@/src/components/Elements/EyeClose";

export default function RegisterLeftSide() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { register, oauth42 } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await register(username, email, password);
      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message ?? "Error al crear la cuenta");
      } else {
        alert("Ha ocurrido un error inesperado");
      }
    }
  };
  return (
    <section className="flex h-full flex-col bg-[#141312] px-6 py-6 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#2b2a28] text-xl text-[#fabc4d] shadow-sm">
          É
        </div>
        <h1 className="text-3xl font-normal tracking-[-0.04em] text-[#e6e1df] sm:text-4xl">
          Crea tu cuenta.
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#a88a83]">
          Únete a tu equipo, gestiona tus proyectos y conecta con tus
          compañeros.
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
            Continuar con 42
          </button>
        </div>

        <div className="my-5 flex items-center gap-4 text-center font-sans text-[10px] font-semibold uppercase tracking-widest text-[#a88a83]">
          <hr className="flex-1 border-[#2b2a28]" />
          o registrarte con email
          <hr className="flex-1 border-[#2b2a28]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <label className="block font-sans text-xs text-[#e0bfb7]">
            <span className="mb-1 block">Nombre de usuario</span>
            <div className="flex h-10 items-center rounded bg-[#1d1b1a] px-3 transition-all">
              <input
                type="text"
                placeholder="Elige un nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full border-none bg-transparent font-serif text-[14px] text-[#e6e1df] outline-none placeholder:text-[#a88a83]/50"
              />
            </div>
          </label>

          <label className="block font-sans text-xs text-[#e0bfb7]">
            <span className="mb-1 block">Correo electrónico</span>
            <div className="flex h-10 items-center rounded bg-[#1d1b1a] px-3 transition-all">
              <Mail />
              <input
                type="email"
                placeholder="usuario@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-none bg-transparent font-serif text-[14px] text-[#e6e1df] outline-none placeholder:text-[#a88a83]/50"
              />
            </div>
          </label>

          <label className="block font-sans text-xs text-[#e0bfb7]">
            <span className="mb-1 block">Contraseña</span>
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

          <button
            type="submit"
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded bg-[#ef6540] font-sans text-[13px] font-semibold text-[#141312] shadow-lg transition-all hover:bg-[#ff7955] hover:shadow-[#ef6540]/20"
          >
            Crear cuenta
            <Arrow />
          </button>
        </form>

        <Link
          to="/login"
          className="mt-4 flex h-10 w-full items-center justify-center rounded border border-[#ef6540] font-sans text-[13px] font-semibold text-[#ffb4a1] transition-colors hover:bg-[#ef6540]/10"
        >
          ¿Ya tienes una cuenta? Iniciar sesión
        </Link>
      </div>

      <footer className="mt-auto flex items-center justify-center gap-4 pt-4 font-sans text-[11px] text-[#a88a83]">
        <Link to="#" className="hover:text-[#e0bfb7]">
          Términos de servicio
        </Link>
        <span className="h-1 w-1 rounded-full bg-[#363433]" />
        <Link to="#" className="hover:text-[#e0bfb7]">
          Política de privacidad
        </Link>
      </footer>
    </section>
  );
}
