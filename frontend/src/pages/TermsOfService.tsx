import React from 'react';
import { Link } from 'react-router-dom';

export const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 text-gray-200">
      {/* Header */}
      <div className="mb-8 pb-4 border-b border-gray-800">
        <Link to="/" className="text-sm text-indigo-400 hover:text-indigo-300">
          &larr; Back to home
        </Link>
        <h1 className="text-3xl font-bold mt-2 text-white">
          Terms of Service
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Last updated: October 2026
        </p>
      </div>

      {/* Content */}
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
          <h2 className="text-lg font-semibold text-white mb-2">4. Service Availability &amp; Limitation of Liability</h2>
          <p>
            This platform is delivered for educational and technical demonstration purposes within the 42 curriculum. 
            Continuous uptime is not guaranteed, and no liability is assumed for temporary data resets resulting from 
            container restarts or maintenance cycles.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
