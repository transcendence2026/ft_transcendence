import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 text-center text-xs text-gray-400 border-t border-gray-800 bg-gray-950/80 mt-auto">
      <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 px-4">
        <span>© 2026 TasteSync</span>
        <Link to="/terms" className="hover:text-indigo-400 transition-colors">
          Términos / Terms
        </Link>
        <span>•</span>
        <Link to="/privacy" className="hover:text-indigo-400 transition-colors">
          Privacidad / Privacy
        </Link>
      </div>
    </footer>
  );
};

export default Footer;