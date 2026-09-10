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
    <section className="auth-panel">
      <div className="auth-content">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-card bg-surface-raised text-xl text-secondary shadow-sm">
          É
        </div>
        <h1 className="text-3xl font-normal text-text sm:text-4xl">
          Crea tu cuenta.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Únete a tu equipo, gestiona tus proyectos y conecta con tus
          compañeros.
        </p>

        <div className="mt-5">
          <button
            type="button"
            onClick={oauth42}
            className="auth-secondary-button"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-control bg-primary-soft text-xs font-bold text-background">
              42
            </span>
            Continuar con 42
          </button>
        </div>

        <div className="my-5 flex items-center gap-4 text-center font-sans text-[10px] font-semibold uppercase tracking-widest text-muted">
          <hr className="flex-1 border-border" />
          o registrarte con email
          <hr className="flex-1 border-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <label className="auth-label">
            <span className="mb-1 block">Nombre de usuario</span>
            <div className="auth-input-shell">
              <input
                type="text"
                placeholder="Elige un nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="auth-input"
              />
            </div>
          </label>

          <label className="auth-label">
            <span className="mb-1 block">Correo electrónico</span>
            <div className="auth-input-shell">
              <Mail />
              <input
                type="email"
                placeholder="usuario@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>
          </label>

          <label className="auth-label">
            <span className="mb-1 block">Contraseña</span>
            <div className="auth-input-shell">
              <Lock />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input tracking-widest placeholder:tracking-normal"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted transition-colors hover:text-text-soft"
              >
                {showPassword ? <EyeOpen /> : <EyeClose />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="auth-button mt-2"
          >
            Crear cuenta
            <Arrow />
          </button>
        </form>

        <Link
          to="/login"
          className="auth-outline-button mt-4"
        >
          ¿Ya tienes una cuenta? Iniciar sesión
        </Link>
      </div>

      <footer className="mt-auto flex items-center justify-center gap-4 pt-4 font-sans text-[11px] text-muted">
        <Link to="#" className="hover:text-text-soft">
          Términos de servicio
        </Link>
        <span className="h-1 w-1 rounded-full bg-border" />
        <Link to="#" className="hover:text-text-soft">
          Política de privacidad
        </Link>
      </footer>
    </section>
  );
}
