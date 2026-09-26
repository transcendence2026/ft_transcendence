import { useNavigate } from "react-router-dom";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:3000";

function DashboardContent() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { sendMessage, messages, status } = useWebSocket();

  // Estados para el flujo de activación del 2FA
  const [show2FaModal, setShow2FaModal] = useState<boolean>(false); //hace que se vea el QR, clave y code de 6
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null); //Guarda el string en Base64 de la imagen QR
  const [secret, setSecret] = useState<string | null>(null); //clave alfanumérica que corresponde a imagen QR
  const [twoFactorCode, setTwoFactorCode] = useState<string>(""); //guarda los 6 digitos
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false); //se pone true cuando se confirma la activación
  const [loading2Fa, setLoading2Fa] = useState<boolean>(false); //Bloquea el boton para q usuario no haga multiples clics seguidos

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRejoindreSalon = () => {
    // Ton sendMessage convertit déjà les objets en JSON, c'est parfait !
    sendMessage({ event: 'joinRoom', roomName: 'general' }); 
  } 

  useEffect(() => {
    console.log("Statut WebSocket :", status);
  }, [status]);

  useEffect(() => {
    console.log("Messages reçus:", messages);
  }, [messages]);

  // Paso 1: Pedir el QR a NestJS
  const handleStart2FA = async () => {
    setErrorMessage("");
    setLoading2Fa(true);
    try {
      const response = await axios.post<{ secret: string; qrCodeImage: string }>(
        `${API_BASE_URL}/api/auth/2fa/generate`
      );
      setQrCodeImage(response.data.qrCodeImage);
      setSecret(response.data.secret);
      setShow2FaModal(true);
    } catch (err: any) {
      console.error("Error al generar el 2FA:", err);
      setErrorMessage("No se pudo generar el código QR. Inténtalo de nuevo.");
    } finally {
      setLoading2Fa(false);
    }
  };

  // Paso 2: Enviar los 6 dígitos a NestJS para activar
  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (twoFactorCode.length !== 6) {
      setErrorMessage("Introduce el código de 6 dígitos.");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/auth/2fa/turn-on`, {
        code: twoFactorCode,
      });

      setIsSuccess(true);
	  await refreshUser(); //Actualiza user.isTwoFactorEnabled en AuthContext

      setTimeout(() => {
        setShow2FaModal(false);
        setIsSuccess(false);
        setTwoFactorCode("");
      }, 2000);
    } catch (err: any) {
      console.error("Error al activar 2FA:", err);
      setErrorMessage("Código incorrecto. Vuelve a intentarlo.");
    }
  };
  

  return (
    <main className="min-h-screen bg-[#141312] px-6 py-10 font-serif text-[#e6e1df] sm:px-10">
      <section className="mx-auto max-w-3xl rounded bg-[#1d1b1a] p-8 shadow-2xl sm:p-12">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[#a88a83]">
              Dashboard
            </p>
            <h1 className="mt-3 text-4xl tracking-[-0.04em]">
              Welcome, {user?.username ?? "user"}.
            </h1>
            <p>{messages.map((msg) => msg.data)}</p>
          </div>
          <button
            type="button"
            onClick={handleRejoindreSalon}
            className="rounded border border-[#ef6540] px-4 py-2 font-sans text-sm font-semibold text-[#ffb4a1] transition-colors hover:bg-[#ef6540]/10"
          >
            joinRoom
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded border border-[#ef6540] px-4 py-2 font-sans text-sm font-semibold text-[#ffb4a1] transition-colors hover:bg-[#ef6540]/10"
          >
            Log out
          </button>
        </div>

		{/* Sección de Datos de la Cuenta */}
        <div className="mt-10 border-t border-[#363433] pt-6 font-sans text-sm text-[#e0bfb7]">
          <p>Your account is authenticated.</p>
          <p className="mt-2 text-[#a88a83]">Email: {user?.email ?? "-"}</p>
        </div>
		{/* Sección de Seguridad: 2FA */}
        <div className="mt-6 border-t border-[#363433] pt-6 font-sans">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#e6e1df]">Autenticación en Dos Pasos (2FA)</h3>
              <p className="mt-1 text-sm text-[#a88a83]">
				{user?.isTwoFactorEnabled 
        			? "Tu cuenta está protegida con autenticación de dos factores."
        			: "Protege tu cuenta exigiendo un código temporal además de la contraseña."}
              </p>
            </div>
			{user?.isTwoFactorEnabled ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Activado
              </div>
            ) : (
            <button
              type="button"
              disabled={loading2Fa}
              onClick={handleStart2FA}
              className="rounded bg-[#ef6540] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading2Fa ? "Cargando..." : "Activar 2FA"}
            </button>
			)}
          </div>

          {/* Ventana Modal / Panel de Activación */}
          {show2FaModal && (
            <div className="mt-6 rounded border border-[#363433] bg-[#242120] p-6 shadow-inner">
              <h4 className="text-base font-semibold text-[#ffb4a1]">Configura tu aplicación Authenticator</h4>
              <p className="mt-1 text-xs text-[#a88a83]">
                Escanea el código QR con Google Authenticator o introduce la clave secreta manualmente.
              </p>

              {errorMessage && (
                <div className="mt-3 rounded border border-red-500/30 bg-red-950/40 p-2 text-xs text-red-200">
                  {errorMessage}
                </div>
              )}

              {isSuccess ? (
                <div className="mt-4 rounded border border-green-500/30 bg-green-950/40 p-4 text-center text-sm font-semibold text-green-300">
                  ¡2FA Activado correctamente!
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  {qrCodeImage && (
                    <div className="rounded bg-white p-2">
                      <img src={qrCodeImage} alt="Código QR 2FA" className="h-40 w-40" />
                    </div>
                  )}

                  <div className="flex-1 space-y-3">
                    <div>
                      <span className="text-xs uppercase text-[#a88a83]">Clave de respaldo:</span>
                      <p className="select-all font-mono text-xs text-[#ffb4a1]">{secret}</p>
                    </div>

                    <form onSubmit={handleConfirm2FA} className="space-y-3">
                      <div>
                        <label className="block text-xs uppercase text-[#a88a83]">
                          Código de 6 dígitos:
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="123456"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                          className="mt-1 w-full rounded border border-[#363433] bg-[#141312] px-3 py-2 text-center font-mono text-lg tracking-widest text-[#e6e1df] focus:border-[#ef6540] focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 rounded bg-[#ef6540] py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        >
                          Confirmar y Activar
                        </button>
                        <button
                          type="button"
                          onClick={() => setShow2FaModal(false)}
                          className="rounded border border-[#363433] px-3 py-2 text-sm text-[#a88a83] hover:text-[#e6e1df]"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
