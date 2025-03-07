import { analytics } from './firebase';
import { logEvent } from 'firebase/analytics';

// Tipos de eventos personalizados
export const ANALYTICS_EVENTS = {
  // Eventos de usuario
  USER_LOGIN: 'user_login',
  USER_REGISTER: 'user_register',
  USER_LOGOUT: 'user_logout',
  
  // Eventos de comercio
  BUSINESS_VIEW: 'business_view',
  BUSINESS_CONTACT: 'business_contact',
  BUSINESS_FAVORITE: 'business_favorite',
  BUSINESS_UNFAVORITE: 'business_unfavorite',
  BUSINESS_REGISTER: 'business_register',
  
  // Eventos de búsqueda
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_FILTER_USED: 'search_filter_used',
  SEARCH_CATEGORY_SELECTED: 'search_category_selected',
  
  // Eventos de interacción
  INSTAGRAM_CLICK: 'instagram_click',
  FACEBOOK_CLICK: 'facebook_click',
  PHONE_CALL: 'phone_call',
  WHATSAPP_CLICK: 'whatsapp_click',
  
  // Eventos de reseñas
  REVIEW_CREATE: 'review_create',
  REVIEW_DELETE: 'review_delete',
  REVIEW_REPLY: 'review_reply',
  
  // Eventos de promociones y cupones
  PROMOTION_CREATE: 'promotion_create',
  PROMOTION_VIEW: 'promotion_view',
  COUPON_CREATE: 'coupon_create',
  COUPON_USE: 'coupon_use',
  
  // Eventos de navegación
  PAGE_VIEW: 'page_view',
  MENU_CLICK: 'menu_click',
  FILTER_USE: 'filter_use',
  
  // Eventos de interacción
  SOCIAL_CLICK: 'social_click',
  PHONE_CLICK: 'phone_click',
  CHAT_START: 'chat_start',
  CHAT_MESSAGE: 'chat_message',

  // Eventos de Transporte
  BUS_SCHEDULE_SEARCH: 'bus_schedule_search',
  BUS_SCHEDULE_SAVE: 'bus_schedule_save',
  BUS_SCHEDULE_REMOVE: 'bus_schedule_remove',

  // Eventos de Eventos/Actividades
  EVENT_VIEW: 'event_view',
  EVENT_REGISTER: 'event_register',
  EVENT_UNREGISTER: 'event_unregister',
  EVENT_SHARE: 'event_share',

  // Eventos de Puntos de Interés
  POI_VIEW: 'poi_view',
  POI_CONTACT: 'poi_contact',
  POI_SCHEDULE_VIEW: 'poi_schedule_view',

  // Eventos de Engagement
  NOTIFICATION_OPEN: 'notification_open',
  NOTIFICATION_DISMISS: 'notification_dismiss',
  SHARE_CONTENT: 'share_content',
  DEEP_LINK_OPEN: 'deep_link_open',

  // Eventos de Rendimiento
  APP_ERROR: 'app_error',
  NETWORK_ERROR: 'network_error',
  LOAD_TIME: 'load_time',

  // Eventos de Comercio Específicos
  BUSINESS_HOURS_VIEW: 'business_hours_view',
  BUSINESS_GALLERY_VIEW: 'business_gallery_view',
  BUSINESS_CATEGORY_CLICK: 'business_category_click',
  
  // Evento Custom de Engagement Score
  BUSINESS_ENGAGEMENT_SCORE: 'business_engagement_score'
} as const;

type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

interface AnalyticsParams {
  [key: string]: any;
}

// Función principal de tracking
export function trackEvent(eventName: AnalyticsEvent, params?: AnalyticsParams) {
  try {
    logEvent(analytics, eventName, params);
  } catch (err) {
    console.error('Error tracking event:', err);
  }
}

// Función para trackear vistas de página
export function trackPageView(pageName: string, params?: AnalyticsParams) {
  trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
    page_name: pageName,
    ...params
  });
}

// Función para trackear búsquedas
export function trackSearch(searchType: 'business' | 'category' | 'location', query: string) {
  trackEvent(ANALYTICS_EVENTS.SEARCH_PERFORMED, {
    search_type: searchType,
    search_term: query,
    timestamp: new Date().toISOString()
  });
}

// Función para trackear uso de filtros
export function trackFilterUse(filterType: string, filterValue: string | string[]) {
  trackEvent(ANALYTICS_EVENTS.SEARCH_FILTER_USED, {
    filter_type: filterType,
    filter_value: Array.isArray(filterValue) ? filterValue.join(',') : filterValue,
    timestamp: new Date().toISOString()
  });
}

// Función para trackear interacciones con comercios
export function trackBusinessInteraction(
  businessId: string,
  action: 'view' | 'contact' | 'favorite' | 'unfavorite',
  params?: AnalyticsParams
) {
  const eventMap = {
    view: ANALYTICS_EVENTS.BUSINESS_VIEW,
    contact: ANALYTICS_EVENTS.BUSINESS_CONTACT,
    favorite: ANALYTICS_EVENTS.BUSINESS_FAVORITE,
    unfavorite: ANALYTICS_EVENTS.BUSINESS_UNFAVORITE
  };

  trackEvent(eventMap[action], {
    business_id: businessId,
    timestamp: new Date().toISOString(),
    ...params
  });
}

// Función para trackear interacciones sociales
export function trackSocialInteraction(
  businessId: string,
  network: 'instagram' | 'facebook' | 'whatsapp' | 'website'
) {
  const eventMap = {
    instagram: ANALYTICS_EVENTS.INSTAGRAM_CLICK,
    facebook: ANALYTICS_EVENTS.FACEBOOK_CLICK,
    whatsapp: ANALYTICS_EVENTS.WHATSAPP_CLICK,
    website: ANALYTICS_EVENTS.SOCIAL_CLICK
  };

  trackEvent(eventMap[network], {
    business_id: businessId,
    network,
    timestamp: new Date().toISOString()
  });
}

// Función para trackear llamadas telefónicas
export function trackPhoneCall(businessId: string) {
  trackEvent(ANALYTICS_EVENTS.PHONE_CALL, {
    business_id: businessId,
    timestamp: new Date().toISOString()
  });
}

// Función para trackear reseñas
export function trackReview(
  businessId: string,
  action: 'create' | 'delete' | 'reply',
  params?: AnalyticsParams
) {
  const eventMap = {
    create: ANALYTICS_EVENTS.REVIEW_CREATE,
    delete: ANALYTICS_EVENTS.REVIEW_DELETE,
    reply: ANALYTICS_EVENTS.REVIEW_REPLY
  };

  trackEvent(eventMap[action], {
    business_id: businessId,
    timestamp: new Date().toISOString(),
    ...params
  });
}

// Función para trackear autenticación
export function trackAuth(
  type: 'login' | 'register' | 'logout',
  method?: 'email' | 'google'
) {
  const eventMap = {
    login: ANALYTICS_EVENTS.USER_LOGIN,
    register: ANALYTICS_EVENTS.USER_REGISTER,
    logout: ANALYTICS_EVENTS.USER_LOGOUT
  };

  trackEvent(eventMap[type], method ? { method } : undefined);
}

// Función para trackear engagement score
export function trackBusinessEngagement(businessId: string, interactions: {
  views: number;
  favorites: number;
  reviews: number;
  contactClicks: number;
  promotionViews: number;
  couponUses: number;
}) {
  const weights = {
    views: 1,
    favorites: 5,
    reviews: 10,
    contactClicks: 3,
    promotionViews: 2,
    couponUses: 8
  };

  const score = Object.entries(interactions).reduce((total, [key, value]) => {
    return total + (value * weights[key as keyof typeof weights]);
  }, 0);

  trackEvent(ANALYTICS_EVENTS.BUSINESS_ENGAGEMENT_SCORE, {
    business_id: businessId,
    score,
    ...interactions,
    timestamp: new Date().toISOString(),
    day_of_week: new Date().getDay(),
    hour_of_day: new Date().getHours(),
    is_weekend: [0,6].includes(new Date().getDay())
  });
}

// Función para trackear errores de la app
export function trackAppError(error: Error, context?: string) {
  trackEvent(ANALYTICS_EVENTS.APP_ERROR, {
    error_name: error.name,
    error_message: error.message,
    error_stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
}

// Función para trackear tiempos de carga
export function trackLoadTime(component: string, timeInMs: number) {
  trackEvent(ANALYTICS_EVENTS.LOAD_TIME, {
    component,
    time_ms: timeInMs,
    timestamp: new Date().toISOString()
  });
}

// Función para trackear interacciones con eventos
export function trackEventInteraction(
  eventId: string,
  action: 'view' | 'register' | 'unregister' | 'share',
  params?: AnalyticsParams
) {
  const eventMap = {
    view: ANALYTICS_EVENTS.EVENT_VIEW,
    register: ANALYTICS_EVENTS.EVENT_REGISTER,
    unregister: ANALYTICS_EVENTS.EVENT_UNREGISTER,
    share: ANALYTICS_EVENTS.EVENT_SHARE
  };

  trackEvent(eventMap[action], {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    ...params
  });
}

// Función para trackear interacciones con puntos de interés
export function trackPoiInteraction(
  poiId: string,
  action: 'view' | 'contact' | 'schedule_view',
  params?: AnalyticsParams
) {
  const eventMap = {
    view: ANALYTICS_EVENTS.POI_VIEW,
    contact: ANALYTICS_EVENTS.POI_CONTACT,
    schedule_view: ANALYTICS_EVENTS.POI_SCHEDULE_VIEW
  };

  trackEvent(eventMap[action], {
    poi_id: poiId,
    timestamp: new Date().toISOString(),
    ...params
  });
}