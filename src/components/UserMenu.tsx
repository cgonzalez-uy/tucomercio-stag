import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { Button } from './ui/button';
import { User, LogOut, Heart, Star, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function UserMenu() {
  const [user] = useAuthState(auth);
  const [showMenu, setShowMenu] = useState(false);
  const [hasBusinessAccess, setHasBusinessAccess] = useState(false);
  const navigate = useNavigate();

  // Check if user has business access
  useEffect(() => {
    const checkBusinessAccess = async () => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        setHasBusinessAccess(!!idTokenResult.claims.businessId);
      }
    };

    checkBusinessAccess();
  }, [user]);

  const handleLogout = async () => {
    await auth.signOut();
    setShowMenu(false);
  };

  if (!user) {
    return (
      <Button
        variant="outline"
        onClick={() => navigate('/user/login')}
        className="flex items-center gap-2"
      >
        <User className="h-4 w-4" />
        <span>Iniciar sesión</span>
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Usuario'}
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <User className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {user.displayName || user.email?.split('@')[0]}
        </span>
      </Button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.displayName || user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>

            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setShowMenu(false)}
            >
              <User className="h-4 w-4" />
              Mi Perfil
            </Link>

            <Link
              to="/favorites"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setShowMenu(false)}
            >
              <Heart className="h-4 w-4" />
              Favoritos
            </Link>

            <Link
              to="/reviews"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setShowMenu(false)}
            >
              <Star className="h-4 w-4" />
              Mis Reseñas
            </Link>

            {hasBusinessAccess && (
              <Link
                to="/portal/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/5 border-t"
                onClick={() => setShowMenu(false)}
              >
                <Store className="h-4 w-4" />
                Gestionar Comercio
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}