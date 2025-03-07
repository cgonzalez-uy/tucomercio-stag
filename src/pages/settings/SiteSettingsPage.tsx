import { useState, useRef, useEffect } from 'react';
import { useSettings } from '../../lib/hooks/useSettings';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Upload, Save, Loader2, X, CheckCircle2, Instagram, Facebook, Twitter } from 'lucide-react';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export function SiteSettingsPage() {
  const { settings, loading, error, updateSetting, createSetting } = useSettings('site-settings');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notificationTimeoutRef = useRef<number>();

  // Get existing settings
  const logo = settings.find(s => s.key === 'logo')?.value || '';
  const heroTitle = settings.find(s => s.key === 'hero-title')?.value || '';
  const heroSubtitle = settings.find(s => s.key === 'hero-subtitle')?.value || '';
  const contactEmail = settings.find(s => s.key === 'contact-email')?.value || '';
  const contactPhone = settings.find(s => s.key === 'contact-phone')?.value || '';
  const instagramUrl = settings.find(s => s.key === 'instagram-url')?.value || '';
  const facebookUrl = settings.find(s => s.key === 'facebook-url')?.value || '';
  const twitterUrl = settings.find(s => s.key === 'twitter-url')?.value || '';

  // Form state
  const [formData, setFormData] = useState({
    heroTitle: '',
    heroSubtitle: '',
    contactEmail: '',
    contactPhone: '',
    instagramUrl: '',
    facebookUrl: '',
    twitterUrl: ''
  });

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        window.clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Initialize form data when settings load
  useEffect(() => {
    setFormData({
      heroTitle: heroTitle,
      heroSubtitle: heroSubtitle,
      contactEmail: contactEmail,
      contactPhone: contactPhone,
      instagramUrl: instagramUrl,
      facebookUrl: facebookUrl,
      twitterUrl: twitterUrl
    });
    if (logo) {
      setImagePreview(logo);
    }
  }, [heroTitle, heroSubtitle, contactEmail, contactPhone, instagramUrl, facebookUrl, twitterUrl, logo]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message });
    
    if (notificationTimeoutRef.current) {
      window.clearTimeout(notificationTimeoutRef.current);
    }
    
    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Create temporary preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Upload file to Firebase Storage
      const storageRef = ref(storage, `site/logo-${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      // Update or create logo setting
      const logoSetting = settings.find(s => s.key === 'logo');
      if (logoSetting) {
        // Delete old logo from storage if it exists
        if (logoSetting.value && !logoSetting.value.includes('logo.svg')) {
          try {
            const oldLogoRef = ref(storage, logoSetting.value);
            await deleteObject(oldLogoRef);
          } catch (err) {
            console.error('Error deleting old logo:', err);
          }
        }
        await updateSetting(logoSetting.id, { value: url });
      } else {
        await createSetting('logo', url);
      }

      // Update preview with real URL
      setImagePreview(url);
      showNotification('success', 'Logo actualizado correctamente');
    } catch (err) {
      console.error('Error uploading logo:', err);
      setImagePreview(logo);
      showNotification('error', 'Error al subir el logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setUploading(true);
      const logoSetting = settings.find(s => s.key === 'logo');
      if (logoSetting && logoSetting.value && !logoSetting.value.includes('logo.svg')) {
        // Delete file from storage
        const logoRef = ref(storage, logoSetting.value);
        await deleteObject(logoRef);
      }
      // Update setting with default logo
      if (logoSetting) {
        await updateSetting(logoSetting.id, { value: '/logo.svg' });
      }
      setImagePreview('/logo.svg');
      showNotification('success', 'Logo eliminado correctamente');
    } catch (err) {
      console.error('Error removing logo:', err);
      showNotification('error', 'Error al eliminar el logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update or create hero title
      const titleSetting = settings.find(s => s.key === 'hero-title');
      if (titleSetting) {
        await updateSetting(titleSetting.id, { value: formData.heroTitle });
      } else {
        await createSetting('hero-title', formData.heroTitle);
      }

      // Update or create hero subtitle
      const subtitleSetting = settings.find(s => s.key === 'hero-subtitle');
      if (subtitleSetting) {
        await updateSetting(subtitleSetting.id, { value: formData.heroSubtitle });
      } else {
        await createSetting('hero-subtitle', formData.heroSubtitle);
      }

      // Update or create contact email
      const emailSetting = settings.find(s => s.key === 'contact-email');
      if (emailSetting) {
        await updateSetting(emailSetting.id, { value: formData.contactEmail });
      } else {
        await createSetting('contact-email', formData.contactEmail);
      }

      // Update or create contact phone
      const phoneSetting = settings.find(s => s.key === 'contact-phone');
      if (phoneSetting) {
        await updateSetting(phoneSetting.id, { value: formData.contactPhone });
      } else {
        await createSetting('contact-phone', formData.contactPhone);
      }

      // Update or create social media URLs
      const instagramSetting = settings.find(s => s.key === 'instagram-url');
      if (instagramSetting) {
        await updateSetting(instagramSetting.id, { value: formData.instagramUrl });
      } else {
        await createSetting('instagram-url', formData.instagramUrl);
      }

      const facebookSetting = settings.find(s => s.key === 'facebook-url');
      if (facebookSetting) {
        await updateSetting(facebookSetting.id, { value: formData.facebookUrl });
      } else {
        await createSetting('facebook-url', formData.facebookUrl);
      }

      const twitterSetting = settings.find(s => s.key === 'twitter-url');
      if (twitterSetting) {
        await updateSetting(twitterSetting.id, { value: formData.twitterUrl });
      } else {
        await createSetting('twitter-url', formData.twitterUrl);
      }

      showNotification('success', 'Cambios guardados correctamente');
    } catch (err) {
      console.error('Error saving settings:', err);
      showNotification('error', 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Configuración del Sitio</h2>

      {/* Notificación */}
      <div
        className={`fixed top-4 right-4 transition-all duration-300 ${
          notification.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <X className="h-5 w-5 text-red-500" />
          )}
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Logo */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Logo</h3>
          <div className="space-y-4">
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative w-32 h-32 bg-gray-100 rounded-lg p-4">
                  <img 
                    src={imagePreview} 
                    alt="Logo preview" 
                    className="w-full h-full object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2"
                    onClick={handleRemoveLogo}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-32 h-32 flex flex-col items-center justify-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">Subir logo</span>
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Tamaño recomendado: 64x64 píxeles. Formato: PNG o SVG con fondo transparente.
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm space-y-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Hero Section</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título principal
              </label>
              <Input
                value={formData.heroTitle}
                onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                placeholder="Ej: Conecta con los mejores comercios de Tu Ciudad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtítulo
              </label>
              <Input
                value={formData.heroSubtitle}
                onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                placeholder="Ej: Descubre y apoya los comercios locales. Todo lo que necesitas, cerca de ti."
              />
            </div>
          </div>

          {/* Información de contacto */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Contacto</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email de contacto
                </label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contacto@tucomercio.uy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono de contacto
                </label>
                <Input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+598 99 123 456"
                />
              </div>
            </div>
          </div>

          {/* Redes Sociales */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Redes Sociales</h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Instagram className="h-4 w-4 text-[#E4405F]" />
                  Instagram
                </label>
                <Input
                  value={formData.instagramUrl}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                  placeholder="https://instagram.com/tucomercio.uy"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Facebook className="h-4 w-4 text-[#1877F2]" />
                  Facebook
                </label>
                <Input
                  value={formData.facebookUrl}
                  onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                  placeholder="https://facebook.com/tucomercio.uy"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                  Twitter
                </label>
                <Input
                  value={formData.twitterUrl}
                  onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                  placeholder="https://twitter.com/tucomercio_uy"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}