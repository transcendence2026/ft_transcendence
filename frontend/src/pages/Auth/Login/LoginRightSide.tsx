import { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Mail from "@/src/components/Elements/Mail";
import Lock from "@/src/components/Elements/Lock";
import EyeOpen from "@/src/components/Elements/EyeOpen";
import EyeClose from "@/src/components/Elements/EyeClose";
import Arrow from "@/src/components/Elements/Arrow";

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
        alert(err.response?.data?.message ?? "Error al iniciar sesión");
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
          Bienvenido de nuevo.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Accede a tu panel, gestiona tus proyectos y conecta con tus
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
          o continuar con email
          <hr className="flex-1 border-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
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
            <div className="mb-1 flex justify-between">
              <span>Contraseña</span>
              <Link
                to="#forgot"
                className="text-primary-soft transition-colors hover:text-primary-hover"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
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

          <label className="flex w-full cursor-pointer items-center gap-2 py-1 font-sans text-xs text-text-soft transition-colors hover:text-text">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-3.5 w-3.5 cursor-pointer rounded border-border bg-surface accent-primary"
            />
            Recordar este dispositivo por 30 días
          </label>

          <button
            type="submit"
            className="auth-button mt-2"
          >
            Iniciar sesión
            <Arrow />
          </button>
        </form>

        <Link
          to="/register"
          className="auth-outline-button mt-4"
        >
          ¿No tienes una cuenta? Crear cuenta
        </Link>
      </div>

      <footer className="mt-auto flex items-center justify-center gap-4 pt-4 font-sans text-[11px] text-muted">
        <Link to="#" className="hover:text-text-soft">
          Términos de servicio
        </Link>
        <span className="h-1 w-1 rounded-full bg-border"></span>
        <Link to="#" className="hover:text-text-soft">
          Política de privacidad
        </Link>
      </footer>
    </section>
  );
}
