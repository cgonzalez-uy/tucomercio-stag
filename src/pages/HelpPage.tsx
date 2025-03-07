import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Search, ChevronDown, ChevronUp, Store, CreditCard, Star, Heart, MessageCircle, Bus, Landmark, Ticket, Bell, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Navbar } from '../components/Navbar';
// FAQ Categories and their questions
const FAQ_DATA = {
  general: {
    icon: Store,
    title: 'General',
    questions: [
      {
        q: '¿Qué es TuComercio.uy?',
        a: 'TuComercio.uy es una plataforma que conecta comercios locales con clientes, permitiendo descubrir y explorar negocios cercanos. Los usuarios pueden encontrar información detallada, horarios, métodos de pago y envío, además de poder guardar sus comercios favoritos y dejar reseñas.'
      },
      {
        q: '¿Es gratis usar TuComercio.uy?',
        a: 'Sí, el uso de la plataforma es completamente gratuito para los usuarios. Los comercios pueden registrarse y tener presencia básica sin costo, con opciones de planes premium para funcionalidades adicionales.'
      },
      {
        q: '¿Necesito una cuenta para usar TuComercio.uy?',
        a: 'No necesitas una cuenta para explorar comercios, pero sí para guardar favoritos, dejar reseñas y acceder a funciones personalizadas. Puedes crear una cuenta fácilmente con tu correo electrónico o cuenta de Google.'
      },
      {
        q: '¿Cómo funciona la búsqueda de comercios?',
        a: 'Puedes buscar comercios por nombre, categoría, ubicación o servicios. Los resultados se pueden filtrar por métodos de pago, envío y otros criterios para encontrar exactamente lo que necesitas.'
      }
    ]
  },
  businesses: {
    icon: CreditCard,
    title: 'Para Comercios',
    questions: [
      {
        q: '¿Cómo registro mi comercio?',
        a: 'Puedes registrar tu comercio haciendo clic en "Registrar comercio" en la página principal. El proceso es simple y guiado, donde podrás agregar información como nombre, descripción, horarios, métodos de pago y envío.'
      },
      {
        q: '¿Qué planes están disponibles?',
        a: 'Ofrecemos varios planes adaptados a diferentes necesidades: Plan Gratis (100% gratuito), Plan Básico y Plan Premium. Cada plan incluye diferentes características como estadísticas avanzadas, destacados en búsquedas, gestión de promociones y más.'
      },
      {
        q: '¿Cómo accedo al portal de comercios?',
        a: 'Una vez que tu comercio esté aprobado y tengas un plan activo, podrás acceder al portal de comercios desde el botón "Portal de comercios" con las credenciales proporcionadas.'
      },
      {
        q: '¿Cómo gestiono mis promociones y cupones?',
        a: 'Los planes premium incluyen acceso al sistema de promociones y cupones. Desde el portal de comercios, podrás crear, editar y gestionar tus ofertas, establecer descuentos y períodos de validez.'
      }
    ]
  },
  reviews: {
    icon: Star,
    title: 'Reseñas',
    questions: [
      {
        q: '¿Cómo puedo dejar una reseña?',
        a: 'Para dejar una reseña, debes tener una cuenta y estar iniciado sesión. Luego, visita la página del comercio y haz clic en el botón "Calificar". Podrás asignar estrellas y escribir tu experiencia.'
      },
      {
        q: '¿Puedo editar o eliminar mi reseña?',
        a: 'Sí, puedes editar o eliminar tus reseñas en cualquier momento desde tu perfil en la sección "Mis Reseñas".'
      },
      {
        q: '¿Los comercios pueden responder a las reseñas?',
        a: 'Sí, los comercios con planes premium pueden responder a las reseñas de sus clientes, lo que permite una mejor comunicación y atención al cliente.'
      },
      {
        q: '¿Qué debo hacer si veo una reseña inapropiada?',
        a: 'Si encuentras una reseña que consideras inapropiada, puedes reportarla haciendo clic en el botón de "Reportar" junto a la reseña. Nuestro equipo la revisará lo antes posible.'
      }
    ]
  },
  favorites: {
    icon: Heart,
    title: 'Favoritos',
    questions: [
      {
        q: '¿Cómo guardo un comercio en favoritos?',
        a: 'Para guardar un comercio en favoritos, debes estar iniciado sesión. Luego, haz clic en el ícono de corazón en la tarjeta del comercio o en su página de detalle.'
      },
      {
        q: '¿Dónde encuentro mis comercios favoritos?',
        a: 'Puedes acceder a tus comercios favoritos desde tu perfil en la sección "Mis Favoritos".'
      },
      {
        q: '¿Recibo notificaciones de mis comercios favoritos?',
        a: 'Sí, recibirás notificaciones cuando tus comercios favoritos publiquen nuevas promociones, cupones o actualizaciones importantes.'
      }
    ]
  },
  transport: {
    icon: Bus,
    title: 'Transporte',
    questions: [
      {
        q: '¿Cómo funciona la búsqueda de horarios de ómnibus?',
        a: 'Puedes buscar horarios seleccionando la terminal de origen, destino, fecha y hora. El sistema mostrará todas las opciones disponibles ordenadas por horario.'
      },
      {
        q: '¿Puedo guardar mis horarios favoritos?',
        a: 'Sí, los usuarios registrados pueden guardar horarios frecuentes para acceder rápidamente a ellos desde la sección "Mis Ómnibus".'
      },
      {
        q: '¿Con qué frecuencia se actualizan los horarios?',
        a: 'Los horarios se actualizan regularmente en coordinación con las empresas de transporte. Siempre mostramos la información más reciente disponible.'
      }
    ]
  },
  poi: {
    icon: Landmark,
    title: 'Puntos de Interés',
    questions: [
      {
        q: '¿Qué son los puntos de interés?',
        a: 'Los puntos de interés son lugares importantes de la ciudad como hospitales, comisarías, bancos y otros servicios públicos, con información útil como horarios y teléfonos.'
      },
      {
        q: '¿Cómo encuentro un punto de interés específico?',
        a: 'Puedes buscar puntos de interés por nombre, tipo o ubicación. También puedes filtrar por categorías como salud, seguridad, servicios públicos, etc.'
      }
    ]
  },
  promotions: {
    icon: Ticket,
    title: 'Promociones y Cupones',
    questions: [
      {
        q: '¿Cómo funcionan los cupones?',
        a: 'Los cupones son códigos de descuento que puedes usar en los comercios participantes. Cada cupón tiene condiciones específicas como fecha de validez y porcentaje de descuento.'
      },
      {
        q: '¿Dónde veo mis cupones utilizados?',
        a: 'En tu perfil, en la sección "Mis Cupones", puedes ver el historial de cupones que has utilizado y los que tienes disponibles.'
      },
      {
        q: '¿Cómo me entero de nuevas promociones?',
        a: 'Recibirás notificaciones de nuevas promociones de tus comercios favoritos. También puedes explorar las promociones activas en la página de cada comercio.'
      }
    ]
  },
  notifications: {
    icon: Bell,
    title: 'Notificaciones',
    questions: [
      {
        q: '¿Qué tipo de notificaciones recibiré?',
        a: 'Recibirás notificaciones sobre nuevas promociones, respuestas a tus reseñas, cupones disponibles y actualizaciones de tus comercios favoritos.'
      },
      {
        q: '¿Puedo personalizar mis notificaciones?',
        a: 'Sí, puedes gestionar tus preferencias de notificaciones desde la configuración de tu cuenta para recibir solo las que te interesan.'
      }
    ]
  },
  contact: {
    icon: MessageCircle,
    title: 'Contacto y Soporte',
    questions: [
      {
        q: '¿Cómo puedo contactar con soporte?',
        a: 'Para cualquier consulta o problema, puedes contactarnos a través de nuestro correo de soporte: soporte@tucomercio.uy o usar el chat de soporte en el portal de comercios.'
      },
      {
        q: '¿Cuál es el tiempo de respuesta?',
        a: 'Nos esforzamos por responder todas las consultas en un plazo máximo de 24 horas hábiles.'
      },
      {
        q: '¿Qué hago si tengo problemas técnicos?',
        a: 'Si experimentas problemas técnicos, primero revisa nuestra guía de solución de problemas en el centro de ayuda. Si el problema persiste, contacta a soporte técnico con una descripción detallada del problema.'
      }
    ]
  }
};

export function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>('general');

  // Filter questions based on search term
  const getFilteredQuestions = () => {
    if (!searchTerm) return null;

    const filtered: { category: string; questions: typeof FAQ_DATA[keyof typeof FAQ_DATA]['questions'] }[] = [];

    Object.entries(FAQ_DATA).forEach(([category, data]) => {
      const matchingQuestions = data.questions.filter(
        q => 
          q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.a.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (matchingQuestions.length > 0) {
        filtered.push({
          category,
          questions: matchingQuestions
        });
      }
    });

    return filtered;
  };

  const filteredQuestions = getFilteredQuestions();

  return (
    <div className="min-h-screen bg-gray-50">
            <Navbar />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-[#2193a3] text-white pt-16">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-full">
                <HelpCircle className="h-8 w-8" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              ¿Cómo podemos ayudarte?
            </h1>
            <p className="text-lg text-white/90 md:text-xl">
              Encuentra respuestas a todas tus preguntas sobre TuComercio.uy
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
       
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar en las preguntas frecuentes..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Search Results */}
        {searchTerm && filteredQuestions && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Resultados de búsqueda
            </h2>
            {filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-gray-500">
                  No se encontraron resultados para "{searchTerm}"
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredQuestions.map(({ category, questions }) => {
                  const CategoryIcon = FAQ_DATA[category as keyof typeof FAQ_DATA].icon;
                  return (
                    <div key={category} className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <CategoryIcon className="h-5 w-5 text-primary" />
                        {FAQ_DATA[category as keyof typeof FAQ_DATA].title}
                      </h3>
                      <div className="space-y-4">
                        {questions.map((q, i) => (
                          <div key={i} className="pl-4 border-l-2 border-primary/20">
                            <h4 className="font-medium text-gray-900 mb-2">{q.q}</h4>
                            <p className="text-gray-600">{q.a}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FAQ Categories */}
        {!searchTerm && (
          <div className="space-y-4">
            {Object.entries(FAQ_DATA).map(([key, { icon: Icon, title, questions }]) => (
              <div key={key} className="bg-white rounded-lg shadow-sm">
                <button
                  onClick={() => setOpenCategory(openCategory === key ? null : key)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-gray-900">{title}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({questions.length})
                      </span>
                    </div>
                  </div>
                  {openCategory === key ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                <div
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    openCategory === key ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="p-6 pt-0 space-y-6">
                    {questions.map((q, i) => (
                      <div key={i} className="pl-4 border-l-2 border-primary/20">
                        <h3 className="font-medium text-gray-900 mb-2">{q.q}</h3>
                        <p className="text-gray-600">{q.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-12 bg-primary/5 rounded-lg p-6 text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            ¿No encontraste lo que buscabas?
          </h2>
          <p className="text-gray-600 mb-4">
            Nuestro equipo de soporte está disponible para ayudarte
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild>
              <a href="mailto:contacto@tucomercio.uy">
                Contactar por Email
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/portal/support">
                Chat de Soporte
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}