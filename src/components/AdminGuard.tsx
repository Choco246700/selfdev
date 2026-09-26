import React from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  // app_metadata is server-controlled; users can't set this themselves
  const isAdmin = user.app_metadata?.is_admin === true;
  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-12 text-center max-w-md mx-auto">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <ShieldAlert size={22} className="text-red-500" />
          </div>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Access denied
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          You don't have permission to view this page.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft size={13} />
          Back to dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};