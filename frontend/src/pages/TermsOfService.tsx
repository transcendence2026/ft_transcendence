import React, { useState } from 'react';
import { Link } from 'react-router-dom'; /* Link permite navegacion sin refrescar la pagina*/

export const TermsOfService: React.FC = () => {
  {/*por defecto en español */}
  const [lang, setLang] = useState<'es' | 'en'>('es');

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 text-gray-200">
      {/* Cabecera y Selector de Idioma */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-800">
        <div>
          <Link to="/" className="text-sm text-indigo-400 hover:text-indigo-300">
            &larr; {lang === 'es' ? 'Volver al inicio' : 'Back to home'}
          </Link>
          <h1 className="text-3xl font-bold mt-2 text-white">
            {lang === 'es' ? 'Términos del Servicio' : 'Terms of Service'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {lang === 'es' ? 'Última actualización: Octubre 2026' : 'Last updated: October 2026'}
          </p>
        </div>

        {/* Botones de cambio de idioma */}
        <div className="flex items-center space-x-2 bg-gray-800 p-1 rounded-lg border border-gray-700 self-start sm:self-auto">
          <button
		  /* boton para español*/
            onClick={() => setLang('es')}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              lang === 'es' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            ES
          </button>
          <button
		  /*boton para ingles*/
            onClick={() => setLang('en')}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              lang === 'en' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {/* CONTENIDO EN ESPAÑOL */}
      {lang === 'es' ? (
        <div className="space-y-6 text-sm leading-relaxed">

		  {/* Aceptacion de los terminos */}
          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">1. Aceptación de los Términos</h2>
            <p>
              Al registrarte, iniciar sesión mediante credenciales locales o el proveedor OAuth de 42, 
              o interactuar con TasteSync, aceptas cumplir y quedar vinculado por estos Términos del Servicio. 
              Si no estás de acuerdo con alguna cláusula, debes cesar el uso de la plataforma.
            </p>
          </section>

		  {/*Cuentas y Seguridad */}
          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">2. Cuentas y Seguridad</h2>
            <p>
              El usuario es responsable de mantener la confidencialidad de sus credenciales y de cualquier 
              configuración de doble factor (2FA/TOTP). Queda estrictamente prohibido compartir accesos, 
              suplantar identidades de otros participantes o eludir los controles técnicos de sesión.
            </p>
          </section>
		  
		  {/* Reglas de Conducta*/}
          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">3. Reglas de Conducta y Chat en Tiempo Real</h2>
            <p>
              TasteSync proporciona canales de comunicación e interacción competitiva. Los usuarios se 
              comprometen a no enviar mensajes ofensivos, no desplegar scripts maliciosos, no abusar de los 
              canales de WebSocket con peticiones automáticas y respetar el juego limpio. Nos reservamos el 
              derecho de suspender cuentas que vulneren estas directrices.
            </p>
          </section>
		  
		  {/* Disponibilidad y Limitación de la Responsabilidad */}
          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">4. Disponibilidad y Limitación de Responsabilidad</h2>
            <p>
              La plataforma se ofrece con fines educativos y de demostración técnica dentro del marco de 42. 
              No se garantiza un servicio ininterrumpido ni se asume responsabilidad por pérdidas de datos 
              temporales derivadas de reinicios del entorno o tareas de mantenimiento.
            </p>
          </section>
        </div>
      ) : (

        /* CONTENIDO EN INGLES */
        <div className="space-y-6 text-sm leading-relaxed">
          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
            <p>
              By registering, logging in via local credentials or the 42 OAuth provider, or interacting with 
              TasteSync, you agree to comply with and be bound by these Terms of Service. If you disagree with 
              any provision, you must discontinue using the platform immediately.
            </p>
          </section>

          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">2. Accounts and Security</h2>
            <p>
              Users are responsible for maintaining the confidentiality of their credentials and any 
              two-factor authentication (2FA/TOTP) configurations. Sharing accounts, impersonating other users, 
              or bypassing technical session controls is strictly prohibited.
            </p>
          </section>

          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">3. Code of Conduct and Real-Time Chat</h2>
            <p>
              TasteSync provides communication channels and real-time interaction. Users agree not to send 
              harmful content, deploy malicious scripts, spam WebSocket connections, or compromise fair play. 
              We reserve the right to suspend accounts that violate these rules.
            </p>
          </section>

          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">4. Service Availability & Limitation of Liability</h2>
            <p>
              This platform is delivered for educational and technical demonstration purposes within the 42 curriculum. 
              Continuous uptime is not guaranteed, and no liability is assumed for temporary data resets resulting from 
              container restarts or maintenance cycles.
            </p>
          </section>
        </div>
      )}
    </div>
  );
};

export default TermsOfService;