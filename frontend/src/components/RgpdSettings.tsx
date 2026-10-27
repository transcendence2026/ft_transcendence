import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './Button';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const RgpdSettings: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Descarga del archivo JSON (Portabilidad / Acceso)
  const handleExportData = async () => {
    setIsExporting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/rgpd/export`, {
        responseType: 'blob',
        withCredentials: true,
      });

      const blob = new Blob([response.data], { type: 'application/json' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `tastesync_data_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setMessage('Data export downloaded successfully.');
    } catch {
      setError('Could not export your data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Eliminación de cuenta (Derecho al olvido)
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setMessage(null);
    setError(null);

    try {
      await axios.delete(`${API_BASE_URL}/api/rgpd/account`, {
        withCredentials: true,
      });

      window.location.href = '/login';
    } catch {
      setError('Could not delete account. Please try again.');
      setIsDeleting(false);
      setShowModal(false);
    }
  };

  return (
    <div className="mt-8 space-y-8 max-w-2xl">
      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}

      {/* Portabilidad y Acceso */}
      <section className="rounded-control border border-border bg-surface p-6">
        <h3 className="font-serif text-xl text-text">Data Portability</h3>
        <p className="mt-2 text-sm text-muted">
          Download a complete JSON file containing your profile info, rated recipes, favorite dishes, and social activity stored in TasteSync.
        </p>
        <div className="mt-5">
          <Button type="button" onClick={() => void handleExportData()} disabled={isExporting}>
            {isExporting ? 'Generating file...' : 'Export my data (.json)'}
          </Button>
        </div>
      </section>

      {/* Supresión de cuenta */}
      <section className="rounded-control border border-red-900/40 bg-surface p-6">
        <h3 className="font-serif text-xl text-red-400">Danger Zone: Delete Account</h3>
        <p className="mt-2 text-sm text-muted">
          Permanently delete your account and all associated personal data according to GDPR. This action cannot be undone.
        </p>
        <div className="mt-5">
          <Button
            type="button"
            variant="ghost"
            className="border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => setShowModal(true)}
          >
            Delete account permanently
          </Button>
        </div>
      </section>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-control border border-border bg-surface p-6 shadow-xl">
            <h4 className="font-serif text-xl text-red-400">Delete Account?</h4>
            <p className="mt-3 text-sm text-text-soft leading-relaxed">
              Are you sure? This will permanently delete your user profile, friendships, posts, and ratings. Your session will end immediately.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-500 text-white border-none"
                onClick={() => void handleDeleteAccount()}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, delete everything'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};