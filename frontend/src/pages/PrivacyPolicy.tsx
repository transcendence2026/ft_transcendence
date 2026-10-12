import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
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
            {lang === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {lang === 'es' 
              ? 'Conforme al RGPD (Reglamento General de Protección de Datos)' 
              : 'In compliance with GDPR (General Data Protection Regulation)'}
          </p>
        </div>

        {/* Botones de cambio de idioma */}
        <div className="flex items-center space-x-2 bg-gray-800 p-1 rounded-lg border border-gray-700 self-start sm:self-auto">
          <button
            onClick={() => setLang('es')}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              lang === 'es' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            ES
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              lang === 'en' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {/* Contenido en Español */}
      {lang === 'es' ? (
        <div className="space-y-6 text-sm leading-relaxed">
          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">1. Responsable y Finalidad del Tratamiento</h2>
            <p>
              TasteSync trata únicamente los datos personales necesarios para permitir la autenticación de usuarios, 
              el funcionamiento de salas y la sincronización de actividades. La base jurídica del tratamiento es la 
              ejecución del servicio solicitado por el propio usuario.
            </p>
          </section>

          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">2. Datos Recopilados</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li><strong>Identificación:</strong> Nombre de usuario, correo electrónico y avatar proporcionado.</li>
              <li><strong>Autenticación:</strong> Hash de contraseña (cifrado irreversible mediante bcrypt) y secretos TOTP para 2FA.</li>
              <li><strong>OAuth 42:</strong> Identificador y correo oficial transferidos mediante la API de 42 previa autorización explícita.</li>
              <li><strong>Actividad en red:</strong> Estado de conexión e interacciones emitidas por WebSockets.</li>
            </ul>
          </section>

          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">3. Política de Cookies</h2>
            <p>
              Utilizamos exclusivamente <strong>cookies técnicas estrictamente necesarias</strong>:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-300">
              <li><code>accessToken</code>: Cookie HttpOnly y SameSite=Lax (validez: 15 min) para autenticar las peticiones API y WebSockets.</li>
              <li><code>refreshToken</code>: Cookie HttpOnly y SameSite=Lax (validez: 7 días) destinada únicamente a renovar la sesión.</li>
            </ul>
            <p className="mt-2 text-xs text-gray-400">
              No se emplean cookies de seguimiento de terceros, publicitarias ni de elaboración de perfiles con fines comerciales.
            </p>
          </section>

          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">4. Derechos del Interesado (ARCO)</h2>
            <p>
              En cualquier momento puedes solicitar el acceso a tus datos, la rectificación de tu perfil, la 
              desactivación de tu 2FA o la supresión completa de tu cuenta y registros asociados a través de las 
              opciones de configuración de tu perfil o contactando con el equipo de desarrollo.
            </p>
          </section>
        </div>
      ) : (
        /* Contenido en Inglés */
        <div className="space-y-6 text-sm leading-relaxed">
          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">1. Data Controller & Purpose</h2>
            <p>
              TasteSync processes only the personal data strictly required to enable user authentication, 
              room coordination, and activity synchronization. The legal basis for processing is the performance 
              of the service requested by the user.
            </p>
          </section>

          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">2. Collected Data</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li><strong>Identity:</strong> Username, email address, and avatar image.</li>
              <li><strong>Authentication:</strong> Password hash (one-way encrypted via bcrypt) and TOTP secrets for 2FA.</li>
              <li><strong>42 OAuth:</strong> Unique ID and intra email transferred via the official 42 API upon explicit consent.</li>
              <li><strong>Network Activity:</strong> Presence status and real-time WebSocket interactions.</li>
            </ul>
          </section>

          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">3. Cookie Policy</h2>
            <p>
              We exclusively use <strong>strictly necessary technical cookies</strong>:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-300">
              <li><code>accessToken</code>: HttpOnly, SameSite=Lax cookie (15-min lifetime) authenticating REST endpoints and WebSocket handshakes.</li>
              <li><code>refreshToken</code>: HttpOnly, SameSite=Lax cookie (7-day lifetime) used solely for token renewals.</li>
            </ul>
            <p className="mt-2 text-xs text-gray-400">
              No third-party tracking, advertising, or profiling cookies are used.
            </p>
          </section>

          <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-2">4. Data Subject Rights (GDPR)</h2>
            <p>
              You may exercise your rights of access, rectification, deletion, or restriction of your account and personal 
              data at any time through your profile settings or by contacting the project team.
            </p>
          </section>
        </div>
      )}
    </div>
  );
};

export default PrivacyPolicy;