import { useState, useRef, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, storage } from '../lib/firebase';
import { useUser } from '../lib/hooks/useUser';
import { useNotifications } from '../lib/hooks/useNotifications';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Link } from 'react-router-dom';
import { Store, Heart, Star, User as UserIcon, Camera, Bell, Settings, ChevronRight, Ticket, X, MessageCircle, Bus, Calendar } from 'lucide-react';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { NotificationBell } from '../components/business/NotificationBell';
import { cn } from '../lib/utils';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function UserProfilePage() {
  const [user] = useAuthState(auth);
  const { profile, loading, error, updateProfile } = useUser(user?.uid);
  const { notifications } = useNotifications(null);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showReplyWarning, setShowReplyWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for unread review replies
  useEffect(() => {
    const hasUnreadReply = notifications.some(
      n => n.type === 'new_review_reply' && !n.read
    );
    setShowReplyWarning(hasUnreadReply);
  }, [notifications]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Inicia sesión para ver tu perfil
          </h2>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await updateProfile({ displayName });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);

      // Upload image to Firebase Storage
      const storageRef = ref(storage, `users/${user.uid}/profile-${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(snapshot.ref);

      // Update user profile in Firebase Auth
      await updateFirebaseProfile(user, { photoURL });

      // Update user profile in Firestore
      await updateProfile({ photoURL });

    } catch (err) {
      console.error('Error uploading profile image:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Mi Perfil</h1>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Information */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative group">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Usuario'}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="h-5 w-5 text-white" />
                  </button>
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-4">
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Tu nombre"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={saving}
                        >
                          {saving ? 'Guardando...' : 'Guardar'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDisplayName(profile?.displayName || '');
                            setIsEditing(false);
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {profile?.displayName || user.email?.split('@')[0]}
                      </h2>
                      <p className="text-gray-500">{user.email}</p>
                      <Button
                        variant="link"
                        onClick={() => setIsEditing(true)}
                        className="px-0"
                      >
                        Editar perfil
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Notificaciones</h3>
                  <p className="text-sm text-gray-500">
                    Recibe notificaciones de tus comercios favoritos
                  </p>
                </div>
                <NotificationBell businessId={null} />
              </div>

              {/* Review Reply Warning */}
              {showReplyWarning && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-yellow-100 rounded-full">
                      <MessageCircle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-yellow-800">
                        Tienes respuestas nuevas a tus reseñas
                      </p>
                      <p className="mt-1 text-sm text-yellow-700">
                        Visita la sección de reseñas para ver las respuestas de los comercios.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowReplyWarning(false)}
                      className="text-yellow-500 hover:text-yellow-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      asChild
                      variant="outline"
                      className="text-yellow-700 bg-yellow-100 border-yellow-200 hover:bg-yellow-200"
                    >
                      <Link to="/reviews">
                        Ver reseñas
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Access Links */}
          <div className="space-y-4">
            <Link
              to="/favorites"
              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Mis Favoritos</h3>
                <p className="text-sm text-gray-500">
                  Comercios que has guardado
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
            </Link>

            <Link
              to="/reviews"
              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Mis Reseñas</h3>
                <p className="text-sm text-gray-500">
                  Reseñas que has publicado
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
            </Link>

            <Link
              to="/coupons"
              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Mis Cupones</h3>
                <p className="text-sm text-gray-500">
                  Cupones que has guardado
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
            </Link>

            <Link
              to="/my-events"
              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Mis Eventos</h3>
                <p className="text-sm text-gray-500">
                  Eventos a los que asistirás
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
            </Link>

            <Link
              to="/buses"
              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Mis Ómnibus</h3>
                <p className="text-sm text-gray-500">
                  Horarios guardados
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
            </Link>

            <Link
              to="/notifications"
              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Notificaciones</h3>
                <p className="text-sm text-gray-500">
                  Ver todas las notificaciones
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
            </Link>

            <Link
              to="/settings"
              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Configuración</h3>
                <p className="text-sm text-gray-500">
                  Gestiona tu cuenta
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
            </Link>

            <Link
              to="/"
              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Explorar</h3>
                <p className="text-sm text-gray-500">
                  Descubre nuevos comercios
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}