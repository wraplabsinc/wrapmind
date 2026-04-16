import { createContext, useContext, useState, useCallback } from 'react';

// ── Translation dictionaries ──────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    // ── Navigation ──
    'nav.dashboard':      'Dashboard',
    'nav.workflow':       'Workflow',
    'nav.leadhub':        'Leads',
    'nav.performance':    'Performance',
    'nav.estimates':      'Estimates',
    'nav.invoices':       'Invoices',
    'nav.reports':        'Reports',
    'nav.clientPortal':   'Client Portal',
    'nav.marketing':      'Marketing',
    'nav.scheduling':     'Scheduling',
    'nav.lists':          'Lists',
    'nav.customers':      'Customers',
    'nav.vehicles':       'Vehicles',
    'nav.manufacturers':  'Manufacturers',
    'nav.shops':          'Shop Profiles',
    'nav.newEstimate':    'New Estimate',
    'nav.settings':       'Settings',
    'nav.help':           'Help',
    'nav.intelligence':   'Intelligence',
    'nav.auditLog':       'Audit Log',
    'nav.notifications':  'Notifications',
    'nav.orders':         'Orders',

    // ── Estimate steps ──
    'step.vehicle':        'Vehicle',
    'step.customer':       'Customer',
    'step.package':        'Package',
    'step.material':       'Material',
    'step.price':          'Price',
    'step.finalQuote':     'Final Quote',
    'step.vehicle.sub':    'Search by VIN, browse, or upload an image',
    'step.customer.sub':   'Add customer details for this estimate',
    'step.package.sub':    'Choose a coverage package',
    'step.material.sub':   'Select wrap material',
    'step.price.sub':      'Reviewing pricing breakdown',
    'step.finalQuote.sub': 'Final quote ready to print',

    // ── Actions ──
    'action.save':       'Save',
    'action.cancel':     'Cancel',
    'action.delete':     'Delete',
    'action.edit':       'Edit',
    'action.close':      'Close',
    'action.print':      'Print',
    'action.send':       'Send',
    'action.export':     'Export',
    'action.search':     'Search',
    'action.filter':     'Filter',
    'action.reset':      'Reset',
    'action.confirm':    'Confirm',
    'action.back':       'Back',
    'action.next':       'Next',
    'action.add':        'Add',
    'action.view':       'View',
    'action.download':   'Download',
    'action.upload':     'Upload',
    'action.newEstimate': 'New Estimate',
    'action.sendEstimate': 'Send Estimate',
    'action.archive':    'Archive',
    'action.printQuote': 'Print Quote',

    // ── Settings nav ──
    'settings.profile':         'Company Profile',
    'settings.billing':         'Billing',
    'settings.users':           'Users',
    'settings.about':           'About',
    'settings.appearance':      'Appearance',
    'settings.general':         'General Settings',
    'settings.laborRates':      'Labor Rates',
    'settings.pricingMatrices': 'Pricing Matrices',
    'settings.laborMatrices':   'Labor Matrices',
    'settings.paymentTerms':    'Payment Terms',
    'settings.paymentTypes':    'Payment Types',
    'settings.payments':        'Payments',
    'settings.carfax':          'Carfax',
    'settings.apiKeys':         'API Keys',
    'settings.webhooks':        'Webhooks',
    'settings.experimental':    'Experimental',
    'settings.staffAccess':     'Staff Portal',
    'settings.language':        'Language',
    'settings.group.account':      'Account',
    'settings.group.settings':     'Settings',
    'settings.group.integrations': 'Integrations',
    'settings.group.superAdmin':   'Super Admin',

    // ── Language page ──
    'language.title':            'Language',
    'language.subtitle':         'Choose your preferred language for WrapMind. Applies site-wide.',
    'language.english':          'English',
    'language.english.native':   'English',
    'language.spanish':          'Spanish',
    'language.spanish.native':   'Español',
    'language.current':          'Currently active',
    'language.saved':            'Language preference saved.',

    // ── Shop profiles ──
    'shops.title':            'Shop Profiles',
    'shops.subtitle':         'Snapshot profiles of every shop using WrapMind — usage, stats, and reviews.',
    'shops.search':           'Search shops…',
    'shops.allRegions':       'All Regions',
    'shops.allTiers':         'All Tiers',
    'shops.estimatesPerMonth': 'Est / mo',
    'shops.closeRate':        'Close Rate',
    'shops.avgTicket':        'Avg Ticket',
    'shops.reviews':          'Reviews',
    'shops.features':         'Features',
    'shops.overview':         'Overview',
    'shops.noResults':        'No shops match your search.',
    'shops.joinedOn':         'Joined',
    'shops.lastActive':       'Last active',
    'shops.totalEstimates':   'Total estimates',
    'shops.totalRevenue':     'Total revenue',
    'shops.topService':       'Top service',
    'shops.topMaterial':      'Top material',

    // ── Common ──
    'common.loading':    'Loading…',
    'common.comingSoon': 'Coming soon',
    'common.signedInAs': 'Signed in as',
    'common.all':        'All',
    'common.active':     'Active',
    'common.inactive':   'Inactive',
    'common.noData':     'No data',
    'common.viewAll':    'View all',
    'common.month':      'month',
    'common.year':       'year',
    'common.of':         'of',
  },

  es: {
    // ── Navegación ──
    'nav.dashboard':      'Panel',
    'nav.workflow':       'Flujo de Trabajo',
    'nav.leadhub':        'Leads',
    'nav.performance':    'Rendimiento',
    'nav.estimates':      'Estimados',
    'nav.invoices':       'Facturas',
    'nav.reports':        'Reportes',
    'nav.clientPortal':   'Portal del Cliente',
    'nav.marketing':      'Marketing',
    'nav.scheduling':     'Calendario',
    'nav.lists':          'Listas',
    'nav.customers':      'Clientes',
    'nav.vehicles':       'Vehículos',
    'nav.manufacturers':  'Fabricantes',
    'nav.shops':          'Perfiles de Tiendas',
    'nav.newEstimate':    'Nuevo Estimado',
    'nav.settings':       'Configuración',
    'nav.help':           'Ayuda',
    'nav.intelligence':   'Inteligencia',
    'nav.auditLog':       'Bitácora',
    'nav.notifications':  'Notificaciones',
    'nav.orders':         'Órdenes',

    // ── Pasos del estimado ──
    'step.vehicle':        'Vehículo',
    'step.customer':       'Cliente',
    'step.package':        'Paquete',
    'step.material':       'Material',
    'step.price':          'Precio',
    'step.finalQuote':     'Cotización Final',
    'step.vehicle.sub':    'Buscar por VIN, navegar o subir una imagen',
    'step.customer.sub':   'Añadir datos del cliente para este estimado',
    'step.package.sub':    'Elegir un paquete de cobertura',
    'step.material.sub':   'Seleccionar material de envoltura',
    'step.price.sub':      'Revisando desglose de precios',
    'step.finalQuote.sub': 'Cotización final lista para imprimir',

    // ── Acciones ──
    'action.save':        'Guardar',
    'action.cancel':      'Cancelar',
    'action.delete':      'Eliminar',
    'action.edit':        'Editar',
    'action.close':       'Cerrar',
    'action.print':       'Imprimir',
    'action.send':        'Enviar',
    'action.export':      'Exportar',
    'action.search':      'Buscar',
    'action.filter':      'Filtrar',
    'action.reset':       'Restablecer',
    'action.confirm':     'Confirmar',
    'action.back':        'Atrás',
    'action.next':        'Siguiente',
    'action.add':         'Añadir',
    'action.view':        'Ver',
    'action.download':    'Descargar',
    'action.upload':      'Subir',
    'action.newEstimate': 'Nuevo Estimado',
    'action.sendEstimate': 'Enviar Estimado',
    'action.archive':     'Archivar',
    'action.printQuote':  'Imprimir Cotización',

    // ── Configuración nav ──
    'settings.profile':         'Perfil de Empresa',
    'settings.billing':         'Facturación',
    'settings.users':           'Usuarios',
    'settings.about':           'Acerca de',
    'settings.appearance':      'Apariencia',
    'settings.general':         'Config. General',
    'settings.laborRates':      'Tarifas de M.O.',
    'settings.pricingMatrices': 'Matrices de Precios',
    'settings.laborMatrices':   'Matrices de M.O.',
    'settings.paymentTerms':    'Términos de Pago',
    'settings.paymentTypes':    'Tipos de Pago',
    'settings.payments':        'Pagos',
    'settings.carfax':          'Carfax',
    'settings.apiKeys':         'Claves API',
    'settings.webhooks':        'Webhooks',
    'settings.experimental':    'Experimental',
    'settings.staffAccess':     'Staff Portal',
    'settings.language':        'Idioma',
    'settings.group.account':      'Cuenta',
    'settings.group.settings':     'Configuración',
    'settings.group.integrations': 'Integraciones',
    'settings.group.superAdmin':   'Super Administrador',

    // ── Página de idioma ──
    'language.title':            'Idioma',
    'language.subtitle':         'Elige tu idioma preferido para WrapMind. Se aplica en todo el sitio.',
    'language.english':          'Inglés',
    'language.english.native':   'English',
    'language.spanish':          'Español',
    'language.spanish.native':   'Español',
    'language.current':          'Activo actualmente',
    'language.saved':            'Preferencia de idioma guardada.',

    // ── Perfiles de tiendas ──
    'shops.title':            'Perfiles de Tiendas',
    'shops.subtitle':         'Perfiles de todas las tiendas que usan WrapMind — uso, estadísticas y reseñas.',
    'shops.search':           'Buscar tiendas…',
    'shops.allRegions':       'Todas las Regiones',
    'shops.allTiers':         'Todos los Niveles',
    'shops.estimatesPerMonth': 'Est / mes',
    'shops.closeRate':        'Tasa de Cierre',
    'shops.avgTicket':        'Ticket Promedio',
    'shops.reviews':          'Reseñas',
    'shops.features':         'Funciones',
    'shops.overview':         'Resumen',
    'shops.noResults':        'Ninguna tienda coincide con tu búsqueda.',
    'shops.joinedOn':         'Unido',
    'shops.lastActive':       'Última actividad',
    'shops.totalEstimates':   'Total de estimados',
    'shops.totalRevenue':     'Ingresos totales',
    'shops.topService':       'Servicio principal',
    'shops.topMaterial':      'Material principal',

    // ── Común ──
    'common.loading':    'Cargando…',
    'common.comingSoon': 'Próximamente',
    'common.signedInAs': 'Conectado como',
    'common.all':        'Todos',
    'common.active':     'Activo',
    'common.inactive':   'Inactivo',
    'common.noData':     'Sin datos',
    'common.viewAll':    'Ver todo',
    'common.month':      'mes',
    'common.year':       'año',
    'common.of':         'de',
  },
};

// ── Context ───────────────────────────────────────────────────────────────────
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('wm-language') || 'en');

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    localStorage.setItem('wm-language', newLang);
    // Update <html lang> attribute for accessibility
    document.documentElement.lang = newLang;
  }, []);

  const t = useCallback((key) => {
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export { TRANSLATIONS };
