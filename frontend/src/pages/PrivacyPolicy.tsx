import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 text-gray-200">
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-gray-800">
        <Link to="/" className="text-sm text-indigo-400 hover:text-indigo-300">
          &larr; Back to home
        </Link>
        <h1 className="text-3xl font-bold mt-2 text-white">
          Privacy Policy
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          In compliance with GDPR (General Data Protection Regulation)
        </p>
      </div>

      {/* Content */}
      <div className="space-y-6 text-sm leading-relaxed">
        <section className="bg-gray-800/60 p-5 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-2">1. Data Controller &amp; Purpose</h2>
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
    </div>
  );
};

export default PrivacyPolicy;
