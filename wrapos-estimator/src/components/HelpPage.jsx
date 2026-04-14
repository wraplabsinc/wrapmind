import { useState, useRef, useCallback } from 'react';
import WMIcon from './ui/WMIcon';

// ─────────────────────────────────────────────────────────────────────────────
// SVG Icons
// ─────────────────────────────────────────────────────────────────────────────

function IconRocket() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
    </svg>
  );
}

function IconCog() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}

function IconQuestionMark() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 text-[#64748B] dark:text-[#7D93AE]">
      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
  );
}

function IconChevronDown({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
  );
}

function IconThumbUp() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
    </svg>
  );
}

function IconThumbDown() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
    </svg>
  );
}

function IconEmail() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  );
}

function IconBug() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1V9a1 1 0 00-.293-.707l-3-3A1 1 0 0016 5h-3V4a1 1 0 00-1-1H3z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

const CATEGORY_ICONS = {
  'getting-started': IconRocket,
  'estimates':       IconDocument,
  'pricing':         IconTag,
  'customers':       IconUsers,
  'wrapmind-ai':     IconSparkles,
  'dashboard':       IconGrid,
  'orders':          IconTruck,
  'scheduling':      IconCalendar,
  'settings':        IconCog,
  'faq':             IconQuestionMark,
};

// ─────────────────────────────────────────────────────────────────────────────
// Help content data
// ─────────────────────────────────────────────────────────────────────────────

const HELP_CONTENT = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    articles: [
      {
        id: 'gs-welcome',
        title: 'Welcome to WrapMind',
        content: [
          { type: 'p', text: 'WrapMind is a complete shop management and estimating platform built specifically for automotive wrap, paint protection film (PPF), window tint, and ceramic coating businesses. Everything is designed to cut estimate time, increase close rates, and keep your team on the same page.' },
          { type: 'h2', text: 'Core modules' },
          { type: 'ul', items: [
            'Estimates — build accurate, professional quotes in minutes using real vehicle surface data, material pricing, and configurable labor rates.',
            'Workflow — track jobs from booked to delivered with a Kanban board your whole team can use.',
            'LeadHub — manage inbound inquiries, assign follow-ups, and convert leads to estimates in one click.',
            'Reports — revenue trends, material mix, technician performance, and funnel analytics.',
            'Settings — configure your shop profile, branding, user roles, labor rates, and appearance.',
            'WrapMind AI — an AI assistant that answers material questions, explains pricing, and helps build estimates using natural language or voice input.',
          ]},
          { type: 'tip', text: 'Start with Settings → Shop Profile to enter your company name and logo. This information appears on every estimate you send.' },
          { type: 'p', text: 'WrapMind runs entirely in the browser with no software to install. It works on desktop and tablet — mobile support is available in read-only mode for viewing estimates on the go.' },
          { type: 'note', text: 'Your data is saved automatically to your account. There is no manual save button.' },
        ],
      },
      {
        id: 'gs-setup',
        title: 'Setting up your shop profile',
        content: [
          { type: 'p', text: 'Your shop profile is the foundation of every estimate. It populates your company name, logo, contact details, and tax settings on all outgoing documents.' },
          { type: 'steps', items: [
            'Navigate to Settings using the gear icon in the left navigation bar.',
            'Select the Profile tab at the top of the Settings page.',
            'Enter your Shop Name, Address, Phone, and Email.',
            'Upload your company logo (PNG, SVG, JPG, or WebP — minimum 100×100 px, maximum 2 MB).',
            'Set your default Tax Rate if you apply sales tax to estimates.',
            'Click Save Profile to apply your changes.',
          ]},
          { type: 'tip', text: 'Your logo appears in the top control bar immediately after upload. It also appears on printed and PDF estimates.' },
          { type: 'p', text: 'You can return to Profile settings at any time to update your information. Changes take effect on new estimates and on existing estimates the next time they are opened.' },
        ],
      },
      {
        id: 'gs-roles',
        title: 'User roles & permissions',
        content: [
          { type: 'p', text: 'WrapMind uses a role-based access system to control what each team member can see and do. Three built-in roles cover most shop structures.' },
          { type: 'h2', text: 'Built-in roles' },
          { type: 'ul', items: [
            'Owner — full access to all features, settings, billing, and user management.',
            'Manager — can build estimates, manage workflow, view reports, and manage leads. Cannot access billing or delete users.',
            'Technician — can view their assigned jobs in Workflow and update job status. Cannot build estimates or view financial data.',
          ]},
          { type: 'h2', text: 'Changing a user\'s role' },
          { type: 'steps', items: [
            'Go to Settings → Users.',
            'Find the user in the team list.',
            'Click the role dropdown next to their name.',
            'Select the new role.',
          ]},
          { type: 'warning', text: 'Downgrading a user from Owner to a lower role will immediately revoke their access to billing and settings. Make sure at least one Owner account remains active on your subscription.' },
        ],
      },
      {
        id: 'gs-nav',
        title: 'Navigating the app',
        content: [
          { type: 'p', text: 'WrapMind uses a fixed left sidebar for primary navigation. Each icon links to a major section of the app.' },
          { type: 'ul', items: [
            'Dashboard — at-a-glance KPIs, pipeline snapshot, industry news, and customisable widgets.',
            'Estimates — your estimate list and the five-step estimate builder.',
            'Workflow — job tracking Kanban board.',
            'LeadHub — inbound leads and follow-up queue.',
            'Customers — customer records linked to estimates and jobs.',
            'Orders — supply order tracker with carrier syncing, backlog tab, and CSV export.',
            'Scheduling — appointment calendar with day/week/month views and online booking.',
            'Reports — revenue trends, material mix, technician performance, and funnel analytics.',
            'Settings — shop configuration, appearance, and integrations.',
            'Help — you are here.',
          ]},
          { type: 'kbd', keys: ['Ctrl', 'K'] },
          { type: 'p', text: 'Use the keyboard shortcut above (or Cmd+K on Mac) to open the global command palette, which lets you jump to any page or start a new estimate without touching the mouse.' },
          { type: 'note', text: 'The WrapMind AI chat panel is accessible from any page by clicking the AI button in the bottom-left of the navigation bar.' },
        ],
      },
    ],
  },
  {
    id: 'estimates',
    label: 'Building Estimates',
    articles: [
      {
        id: 'est-new',
        title: 'Starting a new estimate',
        content: [
          { type: 'p', text: 'Creating an estimate in WrapMind takes about 3–5 minutes once your pricing is configured. The builder walks you through five sequential steps, each validated before moving forward.' },
          { type: 'h2', text: 'The five steps' },
          { type: 'steps', items: [
            'Find the vehicle — search by VIN, browse by Year/Make/Model/Trim, or upload a photo (beta). WrapMind loads the correct panel surface data for the selected trim automatically.',
            'Choose a coverage package — select Full Wrap, Partial Wrap, Hood & Roof, Front-End PPF, Full-Front PPF, or Full-Vehicle PPF. Each package determines which panels are included in the calculation.',
            'Select materials — filter by service type (vinyl, PPF, tint, ceramic) and choose a film or coating. Pricing updates in real time as you make changes.',
            'Apply modifiers — add design complexity, rush fees, paint correction, or other shop-specific line items from your configured modifier list.',
            'Review & send — confirm the price breakdown, enter customer details, and save or send the estimate directly from this screen.',
          ]},
          { type: 'tip', text: 'You can jump between steps using the step indicator at the top of the builder. Completed steps show a checkmark and can be edited at any time before saving.' },
          { type: 'note', text: 'Estimates are auto-saved as drafts while you work. If you close the tab mid-way, your progress is preserved.' },
        ],
      },
      {
        id: 'est-vehicle',
        title: 'Finding a vehicle (VIN, browse, image)',
        content: [
          { type: 'p', text: 'WrapMind offers three ways to identify the vehicle you are estimating. All three methods resolve to the same trim-level data used for surface area calculations.' },
          { type: 'h2', text: 'VIN lookup' },
          { type: 'p', text: 'Scan or type the 17-character Vehicle Identification Number. WrapMind decodes the VIN to identify the exact year, make, model, and trim — including body style variants that affect wrap area. This is the fastest method when the vehicle is in front of you.' },
          { type: 'h2', text: 'Year / Make / Model / Trim browser' },
          { type: 'p', text: 'Use the four-level cascading selector to browse by Year, then Make, then Model, then Trim. This is useful when quoting remotely from a customer description or photo without access to the VIN.' },
          { type: 'h2', text: 'Image upload (beta)' },
          { type: 'p', text: 'Upload a photo of the vehicle and WrapMind AI will attempt to identify the year, make, model, and trim from the image. Results are presented as confidence-ranked suggestions — you confirm the correct match before proceeding.' },
          { type: 'warning', text: 'Image identification is a beta feature and may not correctly identify all vehicles, especially older models or vehicles with significant aftermarket modifications. Always verify the result before proceeding.' },
          { type: 'tip', text: 'After finding the vehicle, review the panel diagram to confirm the body style matches. Some model-year ranges include multiple body styles (e.g. coupe vs. sedan) with different roof and door panel areas.' },
        ],
      },
      {
        id: 'est-packages',
        title: 'Coverage packages explained',
        content: [
          { type: 'p', text: 'Coverage packages define which panels are included in the estimate. WrapMind pre-calculates material square footage, labor time, and pricing based on the package you select.' },
          { type: 'h2', text: 'Vinyl wrap packages' },
          { type: 'ul', items: [
            'Full Wrap — all exterior painted panels including roof, hood, trunk, doors, fenders, bumpers, and mirrors. The most comprehensive option.',
            'Partial Wrap — a designer-defined subset of panels. Commonly used for accent stripes, lower body kits, or colour-split designs. You specify which panels in the modifier step.',
            'Hood & Roof — the two highest-visibility panels, popular as a cost-effective accent wrap.',
            'Racing Stripes — predefined stripe areas only; material and labor scaled to stripe width.',
          ]},
          { type: 'h2', text: 'PPF packages' },
          { type: 'ul', items: [
            'Front-End PPF — hood leading edge, front bumper, and fender tips. The most common entry-level PPF package.',
            'Full-Front PPF — full hood, full front fenders, front bumper, mirrors, and A-pillars. Best protection against highway rock chips.',
            'Full-Vehicle PPF — all painted panels. Typically reserved for new exotic or luxury vehicles.',
          ]},
          { type: 'h2', text: 'Other packages' },
          { type: 'ul', items: [
            'Ceramic Coating — applied to all exterior painted surfaces, glass, or wheels depending on tier selected.',
            'Window Tint — all side glass, or a custom selection of windows specified in the modifier step.',
          ]},
          { type: 'tip', text: 'Packages can be mixed within a single estimate using the "Add another service" option at the bottom of the package selection step. For example, a full wrap with front-end PPF on top.' },
        ],
      },
      {
        id: 'est-materials',
        title: 'Selecting wrap materials',
        content: [
          { type: 'p', text: 'The material selector shows every product in your catalog filtered to the service type selected in the previous step. Each material card shows the product name, brand, type, price per square foot, and a spec summary.' },
          { type: 'h2', text: 'Filtering materials' },
          { type: 'p', text: 'Use the filter bar at the top of the material list to narrow by brand, film type (cast, calendered, self-healing PPF, standard PPF), colour finish, or warranty duration. The filter state is remembered while you are inside the estimate builder.' },
          { type: 'h2', text: 'Reading a material card' },
          { type: 'ul', items: [
            'Price / sq ft — the raw material cost from your catalog. Labor is calculated separately.',
            'Film thickness (mil) — relevant for PPF; thicker films offer more protection.',
            'Warranty — manufacturer warranty duration in years.',
            'Finish — gloss, matte, satin, chrome, or textured.',
            'Cast vs. calendered — cast vinyl conforms to complex curves; calendered is suited to flat or mildly curved surfaces.',
          ]},
          { type: 'h2', text: 'Comparing materials' },
          { type: 'p', text: 'Click the Compare button on any two or three material cards to open a side-by-side spec comparison panel. The comparison shows cost impact on the current estimate alongside technical specifications.' },
          { type: 'tip', text: 'To add a new material to your catalog, go to Settings → Materials & Pricing.' },
        ],
      },
      {
        id: 'est-summary',
        title: 'Reading the price summary',
        content: [
          { type: 'p', text: 'The price summary panel on the right side of the estimate builder shows a live breakdown of all cost components as you make selections.' },
          { type: 'ul', items: [
            'Material cost — total raw material cost at your catalog price per square foot.',
            'Labor — calculated from your configured labor rate for the service type, multiplied by estimated install hours for the selected vehicle and package.',
            'Modifiers — any additional line items you have added (design fee, rush charge, paint correction, etc.).',
            'Subtotal — sum of material, labor, and modifiers.',
            'Tax — applied at the rate configured in your Shop Profile.',
            'Total — final customer-facing price.',
          ]},
          { type: 'h2', text: 'Margin indicator' },
          { type: 'p', text: 'Below the total, a colour-coded margin bar shows your estimated gross margin percentage. Green is healthy (above your configured target), amber is borderline, and red indicates the job is below your margin floor.' },
          { type: 'tip', text: 'You can manually override the total price by toggling "Custom price" in the summary panel. WrapMind will recalculate and display the resulting margin.' },
        ],
      },
      {
        id: 'est-send',
        title: 'Saving and sending estimates',
        content: [
          { type: 'p', text: 'When you are satisfied with the estimate, the Review step lets you attach a customer, set an expiry date, and choose how to deliver the estimate.' },
          { type: 'h2', text: 'Delivery options' },
          { type: 'ul', items: [
            'Save as Draft — stores the estimate without sending. Accessible from the Estimates list.',
            'Copy link — generates a shareable client portal URL. The customer can view and approve the estimate online without creating an account.',
            'Download PDF — exports a branded PDF you can email or print.',
            'Email directly — sends the estimate to the customer\'s email address via WrapMind\'s delivery system.',
          ]},
          { type: 'h2', text: 'Estimate expiry' },
          { type: 'p', text: 'Set an expiry date (default: 30 days) after which the estimate is flagged as expired in your pipeline. An automated reminder email is sent to the customer 3 days before expiry if the estimate has not been approved.' },
          { type: 'note', text: 'Approved estimates can be converted to a Workflow job in one click from the Estimates list.' },
        ],
      },
    ],
  },
  {
    id: 'pricing',
    label: 'Materials & Pricing',
    articles: [
      {
        id: 'pr-labor',
        title: 'Setting up labor rates',
        content: [
          { type: 'p', text: 'Labor rates define how much you charge per hour (or per panel) for installation work. WrapMind applies rates automatically when building estimates based on the service type selected.' },
          { type: 'h2', text: 'Accessing labor rates' },
          { type: 'steps', items: [
            'Go to Settings → Materials & Pricing.',
            'Select the Labor Rates tab.',
            'You will see a rate row for each service type: Vinyl Wrap, PPF, Window Tint, and Ceramic Coating.',
          ]},
          { type: 'h2', text: 'Rate types' },
          { type: 'ul', items: [
            'Hourly rate — your shop\'s labor charge per hour. WrapMind multiplies this by the estimated install hours for the vehicle and package.',
            'Per-panel rate — an alternative billing method where each panel has a fixed labor fee regardless of hours. Useful for shops with flat-rate pricing.',
            'Blended rate — combines a base hourly rate with per-panel minimums.',
          ]},
          { type: 'h2', text: 'What "per panel" means' },
          { type: 'p', text: 'In per-panel mode, each distinct vehicle surface (hood, roof, driver door, etc.) has an individual labor price. WrapMind sums the per-panel fees for all surfaces included in the selected package to calculate total labor.' },
          { type: 'tip', text: 'Most shops charge higher per-panel rates for complex surfaces like bumpers and door handles. You can set different rates for "flat", "moderate complexity", and "high complexity" panels in the advanced labor settings.' },
          { type: 'warning', text: 'Changing labor rates affects all new estimates going forward but does not retroactively update saved estimates.' },
        ],
      },
      {
        id: 'pr-matrix',
        title: 'Pricing matrices',
        content: [
          { type: 'p', text: 'Pricing matrices let you define price tiers based on vehicle size class or job value, rather than calculating from raw cost plus margin. This is useful for shops that prefer fixed package pricing.' },
          { type: 'ul', items: [
            'Create a matrix with rows for vehicle categories (Compact, Sedan, SUV, Truck, Exotic) and columns for service levels.',
            'Enter a price for each cell in the matrix.',
            'When a vehicle is identified in the estimate builder, WrapMind maps it to the appropriate category and suggests the matrix price.',
            'You can override any matrix price on a per-estimate basis.',
          ]},
          { type: 'note', text: 'Matrices work alongside cost-based calculation. You can use matrices for some service types and cost-based pricing for others.' },
        ],
      },
      {
        id: 'pr-materials',
        title: 'Material guide: vinyl, PPF, tint, ceramic',
        content: [
          { type: 'p', text: 'Understanding material categories helps you guide customers to the right product and set accurate pricing.' },
          { type: 'h2', text: 'Vinyl wrap' },
          { type: 'ul', items: [
            'Cast vinyl — made by casting a thin layer of PVC onto a release liner. Highly conformable, ideal for complex curves and recessed areas. Typical thickness: 2–3 mil. Brands: 3M 1080, Avery SW900, KPMF K75400.',
            'Calendered vinyl — manufactured by squeezing PVC through rollers. Stiffer than cast, suited for flat panels. Lower cost but shorter lifespan (3–5 years vs. 7–10 years for cast).',
          ]},
          { type: 'h2', text: 'Paint protection film (PPF)' },
          { type: 'ul', items: [
            'Self-healing PPF — the topcoat layer fills light scratches when exposed to heat (sunlight or warm water). Premium option. Typical thickness: 6–8 mil.',
            'Standard PPF — provides impact protection without self-healing properties. More affordable; suitable for low-exposure areas.',
          ]},
          { type: 'h2', text: 'Ceramic coating' },
          { type: 'ul', items: [
            'Hardness — measured on the pencil hardness scale (e.g. 9H). Higher hardness resists scratches better.',
            'Cure time — professional-grade coatings require 24–72 hours cure time in a controlled environment before the vehicle can be exposed to water.',
            'Layers — multi-layer coatings offer deeper gloss and longer protection. Each layer is cured between applications.',
          ]},
          { type: 'h2', text: 'Window tint' },
          { type: 'ul', items: [
            'VLT (Visible Light Transmission) — the percentage of visible light the tint allows through. Lower VLT = darker tint.',
            'TSER (Total Solar Energy Rejected) — the percentage of total solar energy blocked. Higher TSER = cooler interior.',
            'Ceramic tint — blocks IR heat without darkening the window; compatible with electronic devices.',
            'Carbon tint — matte appearance, no signal interference, good IR rejection.',
            'Dyed tint — most affordable; absorbs heat but fades over time.',
          ]},
        ],
      },
      {
        id: 'pr-margin',
        title: 'Understanding margin & profitability',
        content: [
          { type: 'p', text: 'WrapMind calculates gross margin on every estimate so you can price confidently and identify jobs that might not be worth taking.' },
          { type: 'h2', text: 'How margin is calculated' },
          { type: 'p', text: 'Gross margin % = (Selling price − Material cost − Labor cost) ÷ Selling price × 100. This is a gross margin figure — it does not account for overhead, utilities, or insurance.' },
          { type: 'h2', text: 'Setting your margin target' },
          { type: 'steps', items: [
            'Go to Settings → Materials & Pricing → Margin Settings.',
            'Set your Target Margin % (the green threshold).',
            'Set your Minimum Margin % (the red threshold below which the margin bar turns red).',
          ]},
          { type: 'h2', text: 'Overhead tips' },
          { type: 'ul', items: [
            'A commonly used rule of thumb: overhead (rent, utilities, insurance, software) should be 15–25% of total revenue for a typical wrap shop.',
            'If your gross margin target is 50% and overhead is 20%, your net profit target is roughly 30%.',
            'Check your material cost column in the Reports → Material Mix view to identify which films are eating into margins.',
          ]},
          { type: 'tip', text: 'Use the Reports → Profitability view to see average margin by service type and by technician. A low-margin technician might signal a training opportunity or a rate adjustment need.' },
          { type: 'warning', text: 'WrapMind\'s margin calculation uses your catalog material cost. If your actual supplier invoices differ from catalog pricing, update your material costs in Settings to keep margin data accurate.' },
        ],
      },
    ],
  },
  {
    id: 'customers',
    label: 'Customers & Leads',
    articles: [
      {
        id: 'cu-leadhub',
        title: 'Using LeadHub',
        content: [
          { type: 'p', text: 'LeadHub is WrapMind\'s inbound lead management tool. It centralises all incoming inquiries — whether they come from your website contact form, a manual entry, or an import — into a single pipeline.' },
          { type: 'h2', text: 'Lead stages' },
          { type: 'ul', items: [
            'New — freshly received leads that have not been contacted yet.',
            'Contacted — initial outreach has been made.',
            'Estimating — an estimate is in progress or has been sent.',
            'Won — the customer approved an estimate and a job has been created.',
            'Lost — the lead did not convert. Optionally add a loss reason for reporting.',
          ]},
          { type: 'h2', text: 'Adding leads manually' },
          { type: 'p', text: 'Click the "+ New Lead" button in LeadHub, enter the customer\'s name, contact details, vehicle info, and any notes from the initial conversation. Assign the lead to a team member for follow-up.' },
          { type: 'tip', text: 'Use the List view in LeadHub for bulk operations — selecting multiple leads to reassign, export, or move to a new stage.' },
        ],
      },
      {
        id: 'cu-convert',
        title: 'Converting leads to estimates',
        content: [
          { type: 'p', text: 'When a lead is ready to be quoted, WrapMind lets you launch the estimate builder directly from the lead record, pre-populating the customer and vehicle information.' },
          { type: 'steps', items: [
            'Open the lead in LeadHub by clicking its card.',
            'In the lead detail panel, click "Build Estimate".',
            'The estimate builder opens with the customer name and any vehicle details from the lead pre-filled.',
            'Complete the estimate normally — vehicle confirmation, package, material, modifiers.',
            'When the estimate is saved, it is automatically linked to the originating lead.',
          ]},
          { type: 'p', text: 'The lead\'s status automatically advances to "Estimating" when the first estimate is created. It advances to "Won" when an estimate is approved.' },
          { type: 'note', text: 'One lead can have multiple estimates attached — useful when you send a low, mid, and premium option to the same customer.' },
        ],
      },
      {
        id: 'cu-records',
        title: 'Managing customer records',
        content: [
          { type: 'p', text: 'The Customers section stores persistent records for every person or business you have worked with. Customer records aggregate all estimates, jobs, and invoices for that contact.' },
          { type: 'ul', items: [
            'Search customers by name, phone, email, or vehicle.',
            'View the full estimate and job history for any customer.',
            'Edit contact details, add notes, and tag customers for follow-up campaigns.',
            'Merge duplicate customer records if the same person appears twice.',
          ]},
          { type: 'tip', text: 'Customers are automatically created when you save an estimate with a new contact. You don\'t need to manually create customer records in advance.' },
          { type: 'h2', text: 'Customer vehicles' },
          { type: 'p', text: 'Each customer record can store multiple vehicles. When building a new estimate for a returning customer, select them first and their previously quoted vehicles will appear as quick-pick options.' },
        ],
      },
    ],
  },
  {
    id: 'wrapmind-ai',
    label: 'WrapMind AI',
    articles: [
      {
        id: 'ai-intro',
        title: 'What WrapMind AI can do',
        content: [
          { type: 'p', text: 'WrapMind AI is a conversational assistant built directly into the platform. It is designed specifically for the automotive protection industry and understands materials, installation techniques, and shop pricing concepts.' },
          { type: 'h2', text: 'What the AI knows' },
          { type: 'ul', items: [
            'Material specifications — properties, comparisons, and use cases for vinyl wraps, PPF, ceramic coatings, and window tints.',
            'Installation guidance — surface prep, application techniques, post-install care instructions.',
            'Pricing concepts — how to explain margin, markup, and material cost to customers or new employees.',
            'Your catalog — the AI can reference your materials and pricing to answer questions like "what\'s the cheapest cast vinyl we carry?" or "which films have a 10-year warranty?".',
            'WrapMind features — how to use any part of the app.',
          ]},
          { type: 'h2', text: 'What the AI cannot do' },
          { type: 'ul', items: [
            'Write to your system — the AI is read-only. It cannot create estimates, change settings, add customers, or modify your catalog.',
            'Access external systems — it cannot look up live inventory, supplier pricing feeds, or external databases.',
            'Retain memory between sessions — each conversation starts fresh. The AI does not remember what you discussed in a previous session.',
          ]},
          { type: 'tip', text: 'For best results, ask specific questions. "How does self-healing PPF work?" will get a better response than "tell me about PPF".' },
        ],
      },
      {
        id: 'ai-estimates',
        title: 'Building estimates with AI',
        content: [
          { type: 'p', text: 'WrapMind AI can guide you through the estimate process conversationally, especially useful when training new staff or when you are quoting a service type you don\'t do often.' },
          { type: 'p', text: 'While the AI cannot directly create or modify estimates, it can:' },
          { type: 'ul', items: [
            'Walk you through the five-step estimate builder step by step.',
            'Suggest the most appropriate package for a customer\'s stated needs.',
            'Explain the difference between materials relevant to the job.',
            'Calculate rough cost scenarios verbally so you can validate a quote in your head before opening the builder.',
            'Help you write the customer-facing description or notes field on an estimate.',
          ]},
          { type: 'steps', items: [
            'Open the AI chat panel from the navigation bar.',
            'Describe the job: vehicle, customer\'s request, and any known details.',
            'Ask the AI for a package recommendation or material suggestion.',
            'Use its recommendations as a starting point in the estimate builder.',
          ]},
          { type: 'note', text: 'Future versions of WrapMind AI will support direct estimate creation from the chat interface.' },
        ],
      },
      {
        id: 'ai-voice',
        title: 'Using voice input',
        content: [
          { type: 'p', text: 'WrapMind AI supports voice input, allowing you to speak your question instead of typing. This is especially useful when your hands are occupied in the shop.' },
          { type: 'h2', text: 'Starting voice input' },
          { type: 'steps', items: [
            'Open the AI chat panel.',
            'Click the microphone icon next to the text input field.',
            'Grant microphone permission when prompted by your browser (first use only).',
            'Speak your question clearly. The waveform indicator shows that audio is being captured.',
            'WrapMind transcribes your speech and sends the message automatically when you stop speaking.',
          ]},
          { type: 'h2', text: 'Text-to-speech (TTS)' },
          { type: 'p', text: 'You can enable TTS so the AI reads its responses aloud. Toggle "Speak responses" in the AI chat settings panel (the gear icon within the chat window). This is helpful when following instructions while working on a vehicle.' },
          { type: 'h2', text: 'Supported speech languages' },
          { type: 'p', text: 'Voice input supports English (US, UK, AU), Spanish, French, and Portuguese. Speech recognition quality depends on your microphone and ambient noise levels in the shop.' },
          { type: 'warning', text: 'Voice input requires a secure (HTTPS) connection and a browser that supports the Web Speech API. Chrome and Edge provide the best speech recognition accuracy. Safari has limited support.' },
        ],
      },
      {
        id: 'ai-security',
        title: 'AI security & limitations',
        content: [
          { type: 'p', text: 'WrapMind AI is designed with privacy and security as first-class concerns. Here is what you should know about how your data is handled.' },
          { type: 'h2', text: 'Read-only access' },
          { type: 'p', text: 'The AI can read publicly available material and pricing knowledge, and it can reference your catalog data for context — but it cannot write anything back to your account. No estimate, customer record, or setting can be changed through the AI interface.' },
          { type: 'h2', text: 'Financial data' },
          { type: 'p', text: 'Your specific revenue figures, customer invoices, and bank information are never shared with the AI model. When the AI references pricing, it uses your material catalog costs only — not your financial reports.' },
          { type: 'h2', text: 'Session-only memory' },
          { type: 'p', text: 'AI conversations are not persisted after your session ends. There is no chat history stored server-side. Each new session starts a completely fresh conversation context.' },
          { type: 'h2', text: 'AI-generated content' },
          { type: 'ul', items: [
            'Always verify AI suggestions before acting on them, especially for installation techniques on high-value vehicles.',
            'Material specifications from the AI should be cross-referenced with the manufacturer\'s current data sheet.',
            'Pricing suggestions are illustrative — use your configured rates in the estimate builder for accurate quotes.',
          ]},
          { type: 'note', text: 'WrapMind AI is powered by Anthropic\'s Claude model. Conversations may be used for safety monitoring purposes in accordance with Anthropic\'s usage policy. No personal customer data is included in AI requests.' },
        ],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings Guide',
    articles: [
      {
        id: 'set-profile',
        title: 'Shop profile & branding',
        content: [
          { type: 'p', text: 'The Profile tab in Settings controls your shop\'s public-facing identity across the platform.' },
          { type: 'ul', items: [
            'Shop Name — displayed in the top bar and on all estimates.',
            'Logo — appears in the control bar and on PDF exports.',
            'Address — used on printed estimates and the client portal.',
            'Phone & Email — shown on estimate footers.',
            'Tax Rate — default rate applied to new estimates (can be overridden per estimate).',
            'Currency — select your local currency for all pricing displays.',
          ]},
          { type: 'tip', text: 'Upload your logo as a PNG or SVG with a transparent background for the cleanest appearance on both light and dark estimate templates.' },
        ],
      },
      {
        id: 'set-appearance',
        title: 'Appearance & customization',
        content: [
          { type: 'p', text: 'The Appearance tab lets you personalise the WrapMind interface without affecting functionality.' },
          { type: 'ul', items: [
            'Colour theme — choose from preset accent colours or enter a custom hex code. The accent colour is applied to buttons, active states, and highlights throughout the app.',
            'Navigation theme — change the sidebar colour scheme (Dark Navy default, or multiple presets).',
            'Font size — adjust the base text size from Small (12px) to Large (16px) for accessibility.',
            'Font family — choose between Inter (default), Lora (serif), or JetBrains Mono for a technical aesthetic.',
            'Card style — toggle between Flat, Outlined, and Raised card appearances.',
            'Density — switch between Compact, Default, and Comfortable spacing.',
            'Module spacing — controls the gap between dashboard widget cards (Compact 4px → Airy 24px).',
            'Reduce motion — disables all non-essential animations for users sensitive to motion.',
          ]},
          { type: 'note', text: 'Appearance settings are stored per-user, not per-shop. Each team member can have their own visual preferences.' },
        ],
      },
      {
        id: 'set-timezone',
        title: 'Timezone settings',
        content: [
          { type: 'p', text: 'WrapMind uses your configured timezone to display all timestamps, appointment times, and scheduling data in the correct local time.' },
          { type: 'h2', text: 'Setting your timezone' },
          { type: 'steps', items: [
            'Navigate to Settings → General.',
            'Find the Timezone selector.',
            'Choose your timezone from the grouped list (United States, Canada, Mexico & Caribbean, Europe, Asia & Pacific, or Other).',
            'Click Save. All time displays update immediately across the entire app.',
          ]},
          { type: 'h2', text: 'Supported timezones' },
          { type: 'ul', items: [
            'United States — Eastern, Central, Mountain, Pacific, Alaska, Hawaii.',
            'Canada — Newfoundland, Atlantic, Eastern, Central, Mountain, Pacific.',
            'Mexico & Caribbean — Mexico City, Cancún, Puerto Rico.',
            'Europe — London, Paris/Berlin/Rome, Athens, Moscow.',
            'Asia & Pacific — Dubai, Mumbai, Bangkok, Singapore/KL, Tokyo, Sydney, Auckland.',
            'Other — UTC.',
          ]},
          { type: 'tip', text: 'If your shop serves customers across multiple timezones, set your timezone to the zone where your physical shop is located. Customers see their own local time via the client portal.' },
          { type: 'note', text: 'Timezone is saved per-user. Different team members in different locations can each have their own timezone.' },
        ],
      },
      {
        id: 'set-ticker',
        title: 'News ticker settings',
        content: [
          { type: 'p', text: 'The news ticker is a scrolling headline bar at the bottom of the screen. It shows the latest automotive wrap industry news headlines in real time.' },
          { type: 'h2', text: 'Configuring the ticker' },
          { type: 'p', text: 'Ticker settings are found in Settings → General → Ticker.' },
          { type: 'ul', items: [
            'Enable/disable — toggle the ticker on or off site-wide.',
            'Speed — controls how fast headlines scroll. Slow, Normal, or Fast.',
            'Content filter — choose which news categories appear in the ticker (Trade, Wrap, PPF, Window Tint, Ceramic, SEMA, Detailing, Manufacturers).',
          ]},
          { type: 'h2', text: 'Hiding the ticker temporarily' },
          { type: 'p', text: 'Enable Focus Mode (the eye/slash icon in the top control bar) to instantly hide the ticker along with notifications and the XP ring. This is faster than going to Settings when you need a quick distraction-free session.' },
          { type: 'tip', text: 'The ticker draws from the same filtered news feed as the Industry News dashboard widget — both refresh every 30 minutes from the same cache.' },
        ],
      },
      {
        id: 'set-users',
        title: 'Managing users & roles',
        content: [
          { type: 'p', text: 'The Users tab shows all active team members on your WrapMind account. Only users with the Owner role can manage users.' },
          { type: 'steps', items: [
            'Navigate to Settings → Users.',
            'Click "Invite User" to send an email invitation.',
            'Enter the new user\'s email address and select their initial role.',
            'The invited user receives a setup email and creates their own password.',
            'Once they accept, they appear in your team list.',
          ]},
          { type: 'h2', text: 'Removing a user' },
          { type: 'p', text: 'Click the options menu (three dots) next to a user\'s name and select "Remove user". Their account is deactivated and they can no longer log in, but their historical data (estimates they built, notes they added) is preserved.' },
          { type: 'warning', text: 'You cannot remove the last Owner account. Downgrade or delete other users first, or transfer ownership to another user before removing yourself.' },
        ],
      },
      {
        id: 'set-billing',
        title: 'Billing & subscription',
        content: [
          { type: 'p', text: 'The Billing tab shows your current subscription plan, seat count, and payment method.' },
          { type: 'ul', items: [
            'Plan — your current tier (Starter, Pro, or Scale). Each tier has different limits on seats, estimate volume, and feature access.',
            'Seats — the number of active user accounts included in your plan. Adding users beyond your seat limit will prompt an upgrade.',
            'Billing cycle — monthly or annual. Annual plans include a discount.',
            'Payment method — credit card stored via Stripe. WrapMind never stores card numbers directly.',
            'Invoices — downloadable PDF invoices for every billing period.',
          ]},
          { type: 'p', text: 'To upgrade, downgrade, or cancel your subscription, click "Manage Subscription" which opens the Stripe customer portal. Changes take effect at the end of the current billing period.' },
          { type: 'note', text: 'Only users with the Owner role can view or modify billing information.' },
        ],
      },
      {
        id: 'set-export',
        title: 'Exporting & importing preferences',
        content: [
          { type: 'p', text: 'WrapMind lets you export your configured preferences so you can restore them after a reset or transfer them to a new account.' },
          { type: 'h2', text: 'Exporting' },
          { type: 'p', text: 'Go to Settings → Advanced → Export Preferences. A JSON file is downloaded containing your labor rates, material catalog, pricing matrices, and appearance settings. It does not include customer data or estimate history.' },
          { type: 'h2', text: 'Importing' },
          { type: 'steps', items: [
            'Go to Settings → Advanced → Import Preferences.',
            'Upload the JSON file exported from a WrapMind account.',
            'Review the import summary showing what will be overwritten.',
            'Click "Apply Import" to replace your current settings with the imported values.',
          ]},
          { type: 'warning', text: 'Importing preferences will overwrite your existing labor rates and material catalog. This action cannot be undone. Export your current preferences first if you want to keep a backup.' },
        ],
      },
    ],
  },
  // ── Dashboard ────────────────────────────────────────────────────────────────
  {
    id: 'dashboard',
    label: 'Dashboard',
    articles: [
      {
        id: 'dash-modes',
        title: 'Dashboard modes',
        content: [
          { type: 'p', text: 'The WrapMind dashboard adapts to your role and workflow through a set of preset modes. Each mode enables a curated set of widgets without any manual configuration.' },
          { type: 'h2', text: 'Available modes' },
          { type: 'ul', items: [
            'Essentials — KPI strip, today\'s schedule, and upcoming events. Best for quick daily check-ins.',
            'Operations — adds the Funnel, Service Mix, and Profitability widgets for a fuller operational view.',
            'Marketing — focuses on Reputation, Leads, Campaigns, and Referrals widgets.',
            'Sales & CRM — Win/Loss, Best Customer, Pipeline, and Activity Feed.',
            'Gamification — XP Leaderboard, Streak tracker, Team MVP, and active Challenges.',
            'Kitchen Sink — every enabled widget shown at once, including Industry News and What\'s New.',
            'Customize — manually pick and arrange any combination of widgets.',
          ]},
          { type: 'h2', text: 'Switching modes' },
          { type: 'steps', items: [
            'Click the mode selector button in the top-right corner of the Dashboard header.',
            'A dropdown panel shows all modes with a description and active widget count.',
            'Click any mode to instantly switch. Your previous custom layout is preserved.',
          ]},
          { type: 'tip', text: 'The mode dropdown only shows widgets that are active for your account. Hidden or disabled widgets are silently excluded — you won\'t see padlock badges or locked items.' },
          { type: 'note', text: 'Mode preference is saved per-user in your browser. Each team member can have their own dashboard mode.' },
        ],
      },
      {
        id: 'dash-customize',
        title: 'Customising your dashboard layout',
        content: [
          { type: 'p', text: 'Customize mode gives you full control over which widgets appear and in what order.' },
          { type: 'steps', items: [
            'Open the mode dropdown and select Customize.',
            'The widget grid enters edit mode — each widget shows a drag handle.',
            'Drag widgets to reorder them. Changes save automatically.',
            'To remove a widget, click its × button.',
            'To restore a widget, open the widget picker using the + button in the header.',
          ]},
          { type: 'h2', text: 'Resetting your layout' },
          { type: 'p', text: 'If your custom layout gets cluttered, click the Reset Layout button in the mode dropdown panel. This restores the default widget order for the currently selected mode without changing which mode is active.' },
          { type: 'h2', text: 'Module spacing' },
          { type: 'p', text: 'Adjust the gap between dashboard cards in Settings → Appearance → Module Spacing. Options range from Compact (4px) to Airy (24px). The default is Standard (12px).' },
          { type: 'tip', text: 'On large monitors, switching to a 3-column layout in Settings → Appearance gives you more widgets above the fold without scrolling.' },
        ],
      },
      {
        id: 'dash-news',
        title: 'Industry News widget',
        content: [
          { type: 'p', text: 'The Industry News widget aggregates articles from 8 curated automotive wrap and protection industry sources, refreshed every 30 minutes.' },
          { type: 'h2', text: 'News sources' },
          { type: 'ul', items: [
            'Window Film Magazine — trade publication covering film and tint industry news.',
            'Google News: Vehicle Wrap — wrap-specific news aggregation.',
            'Google News: PPF — paint protection film coverage.',
            'Google News: Window Tint — window film regulatory and industry news.',
            'Google News: Ceramic Coating — ceramic coating market coverage.',
            'Google News: SEMA — SEMA show and automotive aftermarket news.',
            'Google News: Detailing — detailing industry trends.',
            'Google News: Manufacturers — XPEL, Avery Dennison, 3M, Llumar coverage.',
          ]},
          { type: 'h2', text: 'Spam filtering' },
          { type: 'p', text: 'WrapMind automatically filters market research spam, press releases, clickbait, and financial promotion articles. Only editorially relevant content from real news sources passes the filter. Near-duplicate headlines are also deduplicated so the same story doesn\'t appear multiple times.' },
          { type: 'h2', text: 'Category tabs' },
          { type: 'p', text: 'Use the category tabs at the top of the News widget to filter articles by source type: All, Trade, Wrap, PPF, Window Tint, Ceramic, SEMA, Detailing, or Manufacturers.' },
          { type: 'tip', text: 'Click the refresh icon on the News widget to force an immediate update, bypassing the 30-minute cache.' },
          { type: 'note', text: 'The Industry News widget is included in Kitchen Sink mode. To add it to a custom layout, select Customize mode and use the widget picker.' },
        ],
      },
      {
        id: 'dash-focus',
        title: 'Focus / No-Distractions mode',
        content: [
          { type: 'p', text: 'Focus mode hides distracting UI elements so you can concentrate on building estimates or managing jobs without visual noise.' },
          { type: 'h2', text: 'What gets hidden' },
          { type: 'ul', items: [
            'The news ticker bar at the bottom of the screen.',
            'The notification bell and unread count badge.',
            'The XP ring (experience progress circle) in the top bar.',
            'The divider between the XP ring and other controls.',
          ]},
          { type: 'h2', text: 'Enabling focus mode' },
          { type: 'steps', items: [
            'Locate the eye/slash icon button in the top control bar (to the left of the notification bell).',
            'Click it to toggle focus mode on. The button turns amber to indicate the mode is active.',
            'Click it again to restore all UI elements.',
          ]},
          { type: 'note', text: 'Focus mode preference is saved to your browser and persists across page reloads. It does not affect other team members\' sessions.' },
          { type: 'tip', text: 'Focus mode pairs well with a dark theme when doing late-night quoting — the app becomes a clean, minimal tool with no distractions.' },
        ],
      },
    ],
  },

  // ── Orders ───────────────────────────────────────────────────────────────────
  {
    id: 'orders',
    label: 'Orders & Supply',
    articles: [
      {
        id: 'ord-overview',
        title: 'Supply order tracker overview',
        content: [
          { type: 'p', text: 'The Orders page is WrapMind\'s built-in supply order tracker. It lets you manage every film roll, PPF kit, and consumable order from placement to delivery — all without leaving the app.' },
          { type: 'h2', text: 'What you can track' },
          { type: 'ul', items: [
            'Order status — Ordered, Shipped, In Transit, Out for Delivery, Delivered, Returned.',
            'Supplier and carrier information.',
            'Tracking number with a direct link to the carrier\'s tracking page.',
            'Order date and received date for delivery time analytics.',
            'Cost per order and order category (Films & Vinyl, PPF, Ceramic, Tint, Tools, Consumables, Other).',
            'Priority level — Normal, High, or Urgent.',
            'Internal notes.',
          ]},
          { type: 'h2', text: 'Three page tabs' },
          { type: 'ul', items: [
            'Active — all open orders (not yet delivered, returned, or archived). Filterable by status.',
            'Backlog — delivered, returned, and manually archived orders. Sortable table with restore capability.',
            'Settings — API key configuration, auto-archive rules, and CSV export.',
          ]},
          { type: 'tip', text: 'Use the category and priority fields to sort your backlog by material type or flag rush orders that need to arrive before a booked job.' },
        ],
      },
      {
        id: 'ord-active',
        title: 'Managing active orders',
        content: [
          { type: 'p', text: 'The Active tab shows all orders that are still in progress. Each order appears as a card with its current status, carrier, and tracking summary.' },
          { type: 'h2', text: 'Creating an order' },
          { type: 'steps', items: [
            'Click the + New Order button in the top-right corner of the Orders page.',
            'Enter the supplier name, item description, and order date.',
            'Add a tracking number and select the carrier (auto-detected from the tracking number format).',
            'Set the category (Films & Vinyl, PPF, Ceramic, etc.) and priority.',
            'Optionally enter the order cost and any notes.',
            'Click Save Order.',
          ]},
          { type: 'h2', text: 'Order statuses' },
          { type: 'ul', items: [
            'Ordered — purchase placed, awaiting carrier pick-up.',
            'Shipped — carrier has the package, no movement yet.',
            'In Transit — package is actively moving through the network.',
            'Out for Delivery — final mile delivery scheduled for today.',
            'Delivered — package received at your shop.',
            'Returned — carrier returned the package to sender.',
          ]},
          { type: 'h2', text: 'Mark as Received' },
          { type: 'p', text: 'When an order arrives, click the Mark Received button on its card. This sets the status to Delivered, records today as the received date, and moves the order to the Backlog tab (if auto-archive is enabled in Settings).' },
          { type: 'h2', text: 'Archiving orders' },
          { type: 'p', text: 'To manually archive an order, open its three-dot menu and select Archive. Archived orders move to the Backlog tab immediately.' },
          { type: 'h2', text: 'Urgent orders' },
          { type: 'p', text: 'Orders with a priority of Urgent are highlighted with an amber left border so they stand out in the card list.' },
        ],
      },
      {
        id: 'ord-backlog',
        title: 'Backlog tab — delivered & archived orders',
        content: [
          { type: 'p', text: 'The Backlog tab stores your order history — all delivered, returned, and manually archived orders. It is a sortable table with full-text search.' },
          { type: 'h2', text: 'Stats strip' },
          { type: 'ul', items: [
            'Total orders — total count of all backlog entries.',
            'Total cost — sum of costs across all backlog orders that have a cost recorded.',
            'Avg Delivery — average number of days between orderDate and receivedDate across all delivered orders. Only shown when sufficient data exists.',
          ]},
          { type: 'h2', text: 'Sorting and searching' },
          { type: 'p', text: 'Click any column header to sort the backlog table by that field. Click the same header again to reverse the sort order. Use the search bar in the Backlog toolbar to filter by supplier, item, or tracking number.' },
          { type: 'h2', text: 'Restoring an archived order' },
          { type: 'p', text: 'If an order was archived by mistake, click the Restore button on its table row. The order moves back to the Active tab with its previous status.' },
          { type: 'h2', text: 'Deleting backlog entries' },
          { type: 'p', text: 'Click the trash icon on any backlog row to permanently delete that order record. This action cannot be undone.' },
          { type: 'warning', text: 'Deleting a backlog entry removes it from the average delivery time calculation. If you want to keep the record for analytics, use the archive function instead.' },
        ],
      },
      {
        id: 'ord-tracking',
        title: 'Background carrier sync',
        content: [
          { type: 'p', text: 'WrapMind can automatically poll carrier APIs to update tracking status in the background, so you don\'t have to manually refresh tracking links.' },
          { type: 'h2', text: 'Poll intervals' },
          { type: 'ul', items: [
            '5 minutes — maximum update frequency, ideal for orders that are Out for Delivery.',
            '30 minutes — recommended for In Transit orders.',
            '1 hour — a balanced choice for most active orders.',
            '3 hours — low-frequency option for orders that have just shipped.',
          ]},
          { type: 'h2', text: 'Setting up carrier sync' },
          { type: 'steps', items: [
            'Navigate to Orders → Settings tab.',
            'Enter your 17track API key in the Carrier Tracking API Key field.',
            'Select your preferred poll interval from the dropdown.',
            'Click Save Settings.',
            'Background sync starts automatically for all active orders that have a tracking number.',
          ]},
          { type: 'h2', text: 'Getting a 17track API key' },
          { type: 'p', text: '17track.net provides free API access for small query volumes. Create an account at 17track.net, go to the Developer section, and generate an API key. The free tier supports up to 100 tracking queries per day, which covers most small shops.' },
          { type: 'h2', text: 'Daily audit' },
          { type: 'p', text: 'In addition to interval polling, WrapMind runs an automated daily audit at 3:00 AM to check all active orders and flag any that have not had a status update in over 48 hours. Stale orders are highlighted in the Active tab.' },
          { type: 'h2', text: 'Last synced time' },
          { type: 'p', text: 'Each order card shows a "synced X ago" timestamp below the tracking number so you know how fresh the status data is.' },
          { type: 'note', text: 'Carrier sync requires an internet connection and a valid 17track API key. Without the key, you can still manually track orders via the tracking link.' },
        ],
      },
      {
        id: 'ord-settings',
        title: 'Orders settings & CSV export',
        content: [
          { type: 'p', text: 'The Orders Settings tab controls integration keys, automation rules, and data export.' },
          { type: 'h2', text: 'Auto-archive delivered orders' },
          { type: 'p', text: 'Enable this toggle to automatically move orders to the Backlog tab a set number of days after they reach Delivered status. Default is 7 days. You can change the threshold from 1 to 90 days.' },
          { type: 'h2', text: 'CSV export' },
          { type: 'ul', items: [
            'Export Active Orders — downloads a CSV of all current active orders with all fields.',
            'Export Backlog — downloads a CSV of the full order history.',
          ]},
          { type: 'p', text: 'CSV files are generated client-side and downloaded immediately — no server processing needed. The file includes: ID, supplier, item, status, carrier, tracking number, order date, received date, cost, category, priority, and notes.' },
          { type: 'h2', text: 'Danger zone' },
          { type: 'p', text: 'The Danger Zone section in Settings contains the Clear Backlog button, which permanently deletes all archived and delivered orders. This cannot be undone. Use the CSV export first if you want to keep a record.' },
          { type: 'warning', text: 'Clearing the backlog is permanent and removes all historical order data, including delivery time data used for the Avg Delivery stat. Export to CSV before clearing.' },
        ],
      },
    ],
  },

  // ── Scheduling ───────────────────────────────────────────────────────────────
  {
    id: 'scheduling',
    label: 'Scheduling & Calendar',
    articles: [
      {
        id: 'sch-overview',
        title: 'Scheduling page overview',
        content: [
          { type: 'p', text: 'The Scheduling page is WrapMind\'s appointment and job calendar. It gives you a visual view of all booked work across your team with day, week, and month granularity.' },
          { type: 'h2', text: 'Calendar views' },
          { type: 'ul', items: [
            'Day view — shows all appointments for a single day in a time-slot grid. Best for checking capacity during booking.',
            'Week view — seven-day grid with appointments as colour-coded blocks. Good for planning the week ahead.',
            'Month view — full calendar month with appointment dots per day. Best for spotting open slots far in advance.',
          ]},
          { type: 'h2', text: 'Navigating the calendar' },
          { type: 'steps', items: [
            'Use the ← → arrows in the calendar header to move forward or back by one period (day/week/month depending on view).',
            'Click the Today button to jump back to the current date.',
            'Use the view switcher buttons (Day / Week / Month) in the toolbar to change the calendar view.',
          ]},
          { type: 'tip', text: 'Double-click any time slot in Day or Week view to create a new appointment starting at that time.' },
        ],
      },
      {
        id: 'sch-appointments',
        title: 'Creating & managing appointments',
        content: [
          { type: 'p', text: 'Appointments represent booked jobs on the calendar. Each appointment is linked to a job, customer, vehicle, and technician.' },
          { type: 'h2', text: 'Creating an appointment' },
          { type: 'steps', items: [
            'Click the + New Appointment button in the scheduling toolbar.',
            'Select the job from your active jobs list, or enter a manual title.',
            'Set the start date and time, and the estimated duration.',
            'Assign a technician from your team.',
            'Add any internal notes visible to staff.',
            'Click Save.',
          ]},
          { type: 'h2', text: 'Editing an appointment' },
          { type: 'p', text: 'Click any appointment block in the calendar to open its detail panel. From there you can edit all fields, reschedule by dragging the block to a new time slot, or mark the appointment as completed.' },
          { type: 'h2', text: 'Appointment colours' },
          { type: 'p', text: 'Appointments are colour-coded by technician by default. You can change the colour scheme in Calendar Settings to group by service type instead.' },
          { type: 'note', text: 'Completing an appointment from the calendar automatically updates the linked job\'s status in the Workflow board.' },
        ],
      },
      {
        id: 'sch-booking',
        title: 'Online booking link',
        content: [
          { type: 'p', text: 'WrapMind generates a public booking URL that your customers can use to request appointments without calling the shop. You manage availability and approve requests.' },
          { type: 'h2', text: 'Finding your booking link' },
          { type: 'steps', items: [
            'Click the gear icon (⚙) in the Scheduling toolbar to open Calendar Settings.',
            'Select the Booking tab inside Calendar Settings.',
            'Your unique booking URL is displayed along with a copy button and a QR code.',
            'Share the URL on your website, Google Business Profile, or social media.',
          ]},
          { type: 'h2', text: 'What customers see' },
          { type: 'p', text: 'The booking page shows your shop name, available time slots based on your configured hours, and a form for the customer\'s name, contact info, vehicle details, and service request. No account is required.' },
          { type: 'h2', text: 'Approving booking requests' },
          { type: 'p', text: 'Incoming booking requests appear in the Scheduling page as pending appointments highlighted in yellow. Click a request to review the details and confirm or decline. Confirmed appointments are added to the calendar and the customer receives an email notification.' },
          { type: 'h2', text: 'Embed on your website' },
          { type: 'p', text: 'An iframe embed code is available in Calendar Settings → Booking. Paste it into your website to embed the booking form directly on your site.' },
          { type: 'tip', text: 'Add your booking link to your Google Business Profile under the "Appointment URL" field. This puts a "Book" button directly on your Google Maps listing.' },
        ],
      },
      {
        id: 'sch-tech',
        title: 'Technicians & availability',
        content: [
          { type: 'p', text: 'The Technicians panel (accessible from the Scheduling toolbar) shows each team member\'s schedule and daily capacity.' },
          { type: 'h2', text: 'Technician panel' },
          { type: 'ul', items: [
            'Each technician appears as a column in Day and Week view when the Technicians panel is enabled.',
            'Hover over a technician\'s column header to see their daily appointment count and total booked hours.',
            'Technicians with zero appointments today are highlighted for easy slot identification.',
          ]},
          { type: 'h2', text: 'Setting availability' },
          { type: 'steps', items: [
            'Go to Calendar Settings → Technicians.',
            'Select a team member.',
            'Set their working hours for each day of the week.',
            'Mark days off or holidays.',
            'Click Save.',
          ]},
          { type: 'p', text: 'Availability hours are reflected in the booking page — customers can only request appointments during configured working hours.' },
          { type: 'tip', text: 'If a technician is on leave, set their availability to "Unavailable" for those dates. Existing appointments will remain but no new bookings will be accepted.' },
        ],
      },
    ],
  },

  {
    id: 'faq',
    label: 'FAQ',
    articles: [
      {
        id: 'faq-password',
        title: 'How do I change my password?',
        content: [
          { type: 'p', text: 'You can change your password from the account menu in the top bar, or from the login screen if you have been locked out.' },
          { type: 'h2', text: 'Changing your password while logged in' },
          { type: 'steps', items: [
            'Click your avatar or initials in the top-right corner of the app.',
            'Select "Account Settings".',
            'Click "Change Password".',
            'Enter your current password, then your new password twice to confirm.',
            'Click Save.',
          ]},
          { type: 'h2', text: 'Resetting a forgotten password' },
          { type: 'steps', items: [
            'On the login page, click "Forgot password?".',
            'Enter your email address.',
            'Check your inbox for a reset link (expires in 1 hour).',
            'Click the link and enter your new password.',
          ]},
          { type: 'note', text: 'For security, WrapMind does not display your current password — only an option to change it.' },
        ],
      },
      {
        id: 'faq-logo',
        title: 'How do I upload my shop logo?',
        content: [
          { type: 'p', text: 'Your shop logo is uploaded through the Profile section in Settings. Once uploaded, it appears immediately in the top control bar and on all PDF estimates.' },
          { type: 'steps', items: [
            'Navigate to Settings using the gear icon in the left sidebar.',
            'Make sure you are on the Profile tab (it is the default).',
            'Scroll to the Logo section.',
            'Drag and drop your logo file onto the upload area, or click the area to open a file picker.',
            'Wait for the validation check — WrapMind verifies the file type, size, and minimum resolution.',
            'Once accepted, a preview of your logo appears. Click Save Profile.',
          ]},
          { type: 'h2', text: 'Accepted formats' },
          { type: 'ul', items: [
            'PNG — recommended for logos with transparency.',
            'SVG — best for logos that need to scale perfectly at any size.',
            'JPG / WebP — accepted but may show a white background on dark mode.',
          ]},
          { type: 'h2', text: 'Size requirements' },
          { type: 'ul', items: [
            'Minimum: 100 × 100 pixels.',
            'Maximum: 2000 × 2000 pixels.',
            'Maximum file size: 2 MB.',
          ]},
          { type: 'tip', text: 'For the best result on both light and dark backgrounds, use a PNG with a transparent background or an SVG. Avoid logos with white fills as they will be invisible in dark mode.' },
          { type: 'p', text: 'To remove your logo, click the trash icon on the logo preview in Settings. The app will revert to displaying your shop name as text.' },
        ],
      },
      {
        id: 'faq-pdf',
        title: 'Can I export estimates as PDF?',
        content: [
          { type: 'p', text: 'Yes. Every estimate can be exported as a branded PDF directly from the estimate builder or from the Estimates list.' },
          { type: 'h2', text: 'From the estimate builder' },
          { type: 'steps', items: [
            'Complete your estimate through to the Review step.',
            'Click the "Download PDF" button.',
            'The PDF is generated instantly and downloaded to your browser\'s default download folder.',
          ]},
          { type: 'h2', text: 'From the Estimates list' },
          { type: 'steps', items: [
            'Go to the Estimates page.',
            'Find the estimate in the list.',
            'Click the options menu (three dots) on the estimate row.',
            'Select "Download PDF".',
          ]},
          { type: 'h2', text: 'What the PDF includes' },
          { type: 'ul', items: [
            'Your shop logo and contact information.',
            'Customer name, vehicle details, and estimate date.',
            'Itemised service breakdown with materials, labor, and modifiers.',
            'Price summary with tax and total.',
            'Terms and conditions if configured in Settings → Profile.',
            'Estimate expiry date and approval instructions.',
          ]},
          { type: 'tip', text: 'To customise the PDF template (fonts, layout, footer text), go to Settings → Appearance → Estimate PDF Settings.' },
        ],
      },
      {
        id: 'faq-mobile',
        title: 'Does WrapMind work on mobile?',
        content: [
          { type: 'p', text: 'WrapMind is optimised for desktop and tablet use. The full estimate builder, reports, and settings are designed for screens 768px and wider.' },
          { type: 'h2', text: 'Mobile support' },
          { type: 'ul', items: [
            'Viewing estimates — fully functional on mobile. Customers can view and approve estimates via the client portal on any device.',
            'Workflow board — readable on mobile; cards can be tapped to update job status.',
            'LeadHub — lead list is accessible on mobile in read mode.',
            'Building estimates — the estimate builder is not optimised for small screens and may require horizontal scrolling.',
          ]},
          { type: 'h2', text: 'Add to Home Screen' },
          { type: 'p', text: 'On iOS Safari, you can add WrapMind to your home screen for a full-screen app experience. Tap the Share button in Safari and select "Add to Home Screen". The app icon will appear on your home screen and opens without browser chrome.' },
          { type: 'note', text: 'A native iOS and Android app with full mobile estimate building is on the WrapMind roadmap.' },
        ],
      },
      {
        id: 'faq-offline',
        title: 'Does WrapMind work offline?',
        content: [
          { type: 'p', text: 'WrapMind requires an internet connection for full functionality. All data is stored in the cloud and synced in real time.' },
          { type: 'h2', text: 'Limited offline capability' },
          { type: 'p', text: 'If your connection drops briefly while using the app, WrapMind will queue changes locally and sync them automatically when you reconnect. A banner at the top of the screen indicates when you are offline.' },
          { type: 'h2', text: 'What does not work offline' },
          { type: 'ul', items: [
            'Creating or saving new estimates.',
            'Sending estimates to customers.',
            'Accessing the AI chat.',
            'Loading vehicle data for the estimate builder.',
            'Viewing Reports.',
          ]},
          { type: 'h2', text: 'What works offline' },
          { type: 'ul', items: [
            'Viewing previously loaded estimates (cached in the browser).',
            'Reading articles in the Help Center (this page).',
          ]},
          { type: 'tip', text: 'If you frequently work in areas with poor connectivity, consider using a mobile hotspot from your phone as a backup internet connection.' },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Flat article index for search
// ─────────────────────────────────────────────────────────────────────────────

const FLAT_ARTICLES = HELP_CONTENT.flatMap((cat) =>
  cat.articles.map((art) => ({
    ...art,
    categoryId: cat.id,
    categoryLabel: cat.label,
    // Build a searchable text body from block content
    textBody: art.content
      .map((b) => {
        if (b.text) return b.text;
        if (b.items) return b.items.join(' ');
        if (b.keys) return b.keys.join('+');
        return '';
      })
      .join(' ')
      .toLowerCase(),
  }))
);

function searchArticles(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return FLAT_ARTICLES.filter(
    (a) => a.title.toLowerCase().includes(q) || a.textBody.includes(q)
  );
}

function getCategoryForArticle(articleId) {
  return HELP_CONTENT.find((c) => c.articles.some((a) => a.id === articleId));
}

function getArticleById(articleId) {
  return FLAT_ARTICLES.find((a) => a.id === articleId) || null;
}

function getNextArticle(articleId) {
  const cat = getCategoryForArticle(articleId);
  if (!cat) return null;
  const idx = cat.articles.findIndex((a) => a.id === articleId);
  if (idx < 0 || idx >= cat.articles.length - 1) return null;
  return cat.articles[idx + 1];
}

// ─────────────────────────────────────────────────────────────────────────────
// Block renderer
// ─────────────────────────────────────────────────────────────────────────────

function renderBlock(block, i) {
  switch (block.type) {
    case 'p':
      return (
        <p key={i} className="text-sm leading-relaxed text-[#0F1923] dark:text-[#CBD5E1] mb-4">
          {block.text}
        </p>
      );

    case 'h2':
      return (
        <h2 key={i} className="text-sm font-semibold text-[#0F1923] dark:text-[#F8FAFE] mt-6 mb-3 pb-1 border-b border-gray-200 dark:border-[#243348]">
          {block.text}
        </h2>
      );

    case 'ul':
      return (
        <ul key={i} className="list-none space-y-2 mb-4">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-sm text-[#0F1923] dark:text-[#CBD5E1] leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'ol':
      return (
        <ol key={i} className="list-decimal list-inside space-y-1.5 mb-4 pl-1">
          {block.items.map((item, j) => (
            <li key={j} className="text-sm text-[#0F1923] dark:text-[#CBD5E1] leading-relaxed">
              {item}
            </li>
          ))}
        </ol>
      );

    case 'tip':
      return (
        <div key={i} className="flex gap-3 rounded-lg p-3.5 mb-4 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-400">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs mt-0.5 shrink-0">TIP</span>
          <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">{block.text}</p>
        </div>
      );

    case 'warning':
      return (
        <div key={i} className="flex gap-3 rounded-lg p-3.5 mb-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400">
          <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs mt-0.5 shrink-0">WARN</span>
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">{block.text}</p>
        </div>
      );

    case 'note':
      return (
        <div key={i} className="flex gap-3 rounded-lg p-3.5 mb-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400">
          <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs mt-0.5 shrink-0">NOTE</span>
          <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300">{block.text}</p>
        </div>
      );

    case 'steps':
      return (
        <ol key={i} className="space-y-3 mb-4">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-primary)] text-white text-[10px] font-bold shrink-0 mt-0.5">
                {j + 1}
              </span>
              <p className="text-sm leading-relaxed text-[#0F1923] dark:text-[#CBD5E1]">{item}</p>
            </li>
          ))}
        </ol>
      );

    case 'kbd':
      return (
        <div key={i} className="flex items-center gap-1.5 mb-4">
          <span className="text-xs text-[#64748B] dark:text-[#7D93AE] mr-1">Keyboard shortcut:</span>
          {block.keys.map((k, j) => (
            <span key={j} className="inline-flex items-center gap-1">
              <kbd className="px-2 py-0.5 text-xs font-mono rounded border border-gray-300 dark:border-[#3A506B] bg-gray-100 dark:bg-[#1B2A3E] text-[#0F1923] dark:text-[#F8FAFE]">
                {k}
              </kbd>
              {j < block.keys.length - 1 && (
                <span className="text-xs text-[#64748B] dark:text-[#7D93AE]">+</span>
              )}
            </span>
          ))}
        </div>
      );

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick-start cards data
// ─────────────────────────────────────────────────────────────────────────────

const QUICK_CARDS = [
  { id: 'est-new',        title: 'Build Your First Estimate',  desc: 'Start quoting in minutes with our step-by-step builder.',        icon: 'document-text' },
  { id: 'gs-setup',       title: 'Set Up Your Shop Profile',   desc: 'Add your logo, contact info, and tax rate.',                     icon: 'building-storefront' },
  { id: 'ord-tracking',   title: 'Carrier Auto-Sync',          desc: 'Set up background tracking updates for supply orders.',           icon: 'archive-box' },
  { id: 'dash-modes',     title: 'Dashboard Modes',            desc: 'Switch between Essentials, Ops, Marketing, and more.',           icon: 'squares-2x2' },
  { id: 'sch-booking',    title: 'Online Booking Link',        desc: 'Share your booking URL and accept appointment requests.',         icon: 'calendar' },
  { id: 'dash-focus',     title: 'Focus Mode',                 desc: 'Hide the ticker, notifications, and XP ring in one click.',      icon: 'target' },
  { id: 'pr-margin',      title: 'Understand Pricing',         desc: 'Learn how margin is calculated and how to set targets.',          icon: 'currency-dollar' },
  { id: 'ai-intro',       title: 'WrapMind AI Guide',          desc: 'See what the AI assistant can do for your shop.',                icon: 'sparkles' },
  { id: 'faq-password',   title: 'Browse the FAQ',             desc: 'Quick answers to the most common questions.',                    icon: 'magnifying-glass' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SearchBar({ query, onChange, inputRef, placeholder = 'Search help articles…' }) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 pointer-events-none">
        <IconSearch />
      </span>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] text-[#0F1923] dark:text-[#F8FAFE] placeholder-[#64748B] dark:placeholder-[#7D93AE] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-ring)]"
      />
      {query.length > 0 && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] transition-colors"
          aria-label="Clear search"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
}

function NavCategory({ category, isOpen, activeArticle, onToggle, onSelectArticle }) {
  const Icon = CATEGORY_ICONS[category.id] || IconDocument;
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#1B2A3E] transition-colors group"
      >
        <div className="flex items-center gap-2">
          <span className="text-[#64748B] dark:text-[#7D93AE] group-hover:text-[var(--accent-primary)] transition-colors">
            <Icon />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">
            {category.label}
          </span>
        </div>
        <span className="text-[#64748B] dark:text-[#7D93AE]">
          <IconChevronDown open={isOpen} />
        </span>
      </button>
      {isOpen && (
        <ul className="mt-0.5 mb-1 ml-5 pl-2 border-l border-gray-200 dark:border-[#243348] space-y-0.5">
          {category.articles.map((article) => {
            const isActive = activeArticle === article.id;
            return (
              <li key={article.id}>
                <button
                  onClick={() => onSelectArticle(article.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors leading-snug ${
                    isActive
                      ? 'bg-[var(--accent-light)] text-[var(--accent-primary)] font-medium'
                      : 'text-[#64748B] dark:text-[#7D93AE] hover:text-[#0F1923] dark:hover:text-[#F8FAFE] hover:bg-gray-100 dark:hover:bg-[#1B2A3E]'
                  }`}
                >
                  {article.title}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SearchResults({ results, activeArticle, onSelectArticle }) {
  if (results.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">No articles found</p>
      </div>
    );
  }
  return (
    <ul className="space-y-0.5 px-1">
      {results.map((article) => {
        const isActive = activeArticle === article.id;
        return (
          <li key={article.id}>
            <button
              onClick={() => onSelectArticle(article.id)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-[var(--accent-light)] text-[var(--accent-primary)]'
                  : 'hover:bg-gray-100 dark:hover:bg-[#1B2A3E]'
              }`}
            >
              <p className={`text-xs font-medium leading-snug ${isActive ? 'text-[var(--accent-primary)]' : 'text-[#0F1923] dark:text-[#F8FAFE]'}`}>
                {article.title}
              </p>
              <p className="text-[10px] text-[#64748B] dark:text-[#7D93AE] mt-0.5">
                {article.categoryLabel}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function HeroPanel({ onQuickCardClick, searchInputRef }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 max-w-2xl mx-auto w-full">
      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-2">
          How can we help?
        </h1>
        <p className="text-sm text-[#64748B] dark:text-[#7D93AE]">
          Search the knowledge base or browse by category
        </p>
      </div>

      {/* Hero search bar */}
      <div
        className="w-full max-w-md mb-10 cursor-text"
        onClick={() => searchInputRef.current?.focus()}
      >
        <div className="relative flex items-center">
          <span className="absolute left-3 pointer-events-none">
            <IconSearch />
          </span>
          <div className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-white dark:bg-[#1B2A3E] border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] shadow-sm cursor-text">
            Search help articles…
          </div>
        </div>
      </div>

      {/* Quick-start cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        {QUICK_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={() => onQuickCardClick(card.id)}
            className="wm-card text-left bg-white dark:bg-[#1B2A3E] p-4 hover:border-[var(--accent-primary)] hover:shadow-sm transition-all group"
          >
            <WMIcon name={card.icon} className="w-5 h-5 mb-2 text-[var(--accent-primary)]" />
            <p className="text-xs font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-1 group-hover:text-[var(--accent-primary)] transition-colors">
              {card.title}
            </p>
            <p className="text-[11px] leading-relaxed text-[#64748B] dark:text-[#7D93AE]">
              {card.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Contact support */}
      <div className="w-full wm-card bg-white dark:bg-[#1B2A3E] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[var(--accent-primary)]">
            <IconEmail />
          </span>
          <div>
            <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">Contact Support</p>
            <a
              href="mailto:support@wrapmind.io"
              className="text-xs text-[var(--accent-primary)] hover:underline"
            >
              support@wrapmind.io
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#64748B] dark:text-[#7D93AE]">
            <IconBug />
          </span>
          <a
            href="mailto:bugs@wrapmind.io?subject=Bug Report"
            className="text-xs text-[#64748B] dark:text-[#7D93AE] hover:text-[var(--accent-primary)] transition-colors"
          >
            Submit a bug report
          </a>
        </div>
      </div>

      {/* Replay welcome screen */}
      <div className="w-full text-center mt-2">
        <button
          onClick={() => {
            localStorage.removeItem('wm-welcomed');
            window.dispatchEvent(new CustomEvent('wm-show-welcome'));
          }}
          className="text-[11px] text-[#64748B] dark:text-[#7D93AE] hover:text-[var(--accent-primary)] transition-colors underline underline-offset-2"
        >
          Show welcome screen again
        </button>
      </div>
    </div>
  );
}

function ArticlePanel({ articleId, onBack }) {
  const [feedback, setFeedback] = useState(null); // 'up' | 'down' | null
  const article = getArticleById(articleId);
  const category = getCategoryForArticle(articleId);
  const nextArticle = getNextArticle(articleId);

  if (!article || !category) return null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 w-full">
      {/* Back link */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#7D93AE] hover:text-[var(--accent-primary)] transition-colors mb-5 group"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform">
          <IconArrowLeft />
        </span>
        All articles
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-4 text-[11px] text-[#64748B] dark:text-[#7D93AE]">
        <span>{category.label}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        <span className="text-[#0F1923] dark:text-[#F8FAFE]">{article.title}</span>
      </div>

      {/* Article title */}
      <h1 className="text-xl font-semibold text-[#0F1923] dark:text-[#F8FAFE] mb-6 leading-snug">
        {article.title}
      </h1>

      {/* Content blocks */}
      <div className="mb-10">
        {article.content.map((block, i) => renderBlock(block, i))}
      </div>

      {/* Was this helpful */}
      <div className="wm-card bg-white dark:bg-[#1B2A3E] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE]">
          Was this article helpful?
        </p>
        {feedback === null ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFeedback('up')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <IconThumbUp />
              Yes
            </button>
            <button
              onClick={() => setFeedback('down')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-gray-200 dark:border-[#243348] text-[#64748B] dark:text-[#7D93AE] hover:border-red-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <IconThumbDown />
              No
            </button>
          </div>
        ) : (
          <p className="text-xs text-[#64748B] dark:text-[#7D93AE]">
            {feedback === 'up' ? 'Thanks for the feedback!' : 'Thanks — we will work on improving this article.'}
          </p>
        )}
      </div>

      {/* Next article */}
      {nextArticle && (
        <button
          onClick={() => {
            // Find this button's parent ArticlePanel and trigger article change via onBack + article select
            // We use a custom event since onBack only goes to hero; we need to propagate upward
            // Instead we expose onSelectArticle via prop — handled by parent via a wrapper
            onBack('next:' + nextArticle.id);
          }}
          className="w-full wm-card bg-white dark:bg-[#1B2A3E] p-4 flex items-center justify-between hover:border-[var(--accent-primary)] transition-colors group"
        >
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE] mb-0.5">Next article</p>
            <p className="text-xs font-medium text-[#0F1923] dark:text-[#F8FAFE] group-hover:text-[var(--accent-primary)] transition-colors">
              {nextArticle.title}
            </p>
          </div>
          <span className="text-[#64748B] dark:text-[#7D93AE] group-hover:text-[var(--accent-primary)] transition-colors group-hover:translate-x-0.5 transition-transform">
            <IconArrowRight />
          </span>
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function HelpPage({ onNavigate }) {
  const [query, setQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState(null);
  const [openCategories, setOpenCategories] = useState({ 'getting-started': true });

  const searchInputRef = useRef(null);
  const rightPanelRef = useRef(null);

  const searchResults = query.length > 0 ? searchArticles(query) : [];

  const toggleCategory = useCallback((catId) => {
    setOpenCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  }, []);

  const selectArticle = useCallback((id) => {
    setActiveArticle(id);
    // Open the category containing this article
    const cat = getCategoryForArticle(id);
    if (cat) {
      setOpenCategories((prev) => ({ ...prev, [cat.id]: true }));
    }
    // Scroll right panel to top
    if (rightPanelRef.current) {
      rightPanelRef.current.scrollTop = 0;
    }
  }, []);

  // Handle "back" from ArticlePanel — supports "next:articleId" for next-article navigation
  const handleBack = useCallback((signal) => {
    if (typeof signal === 'string' && signal.startsWith('next:')) {
      selectArticle(signal.slice(5));
    } else {
      setActiveArticle(null);
      if (rightPanelRef.current) {
        rightPanelRef.current.scrollTop = 0;
      }
    }
  }, [selectArticle]);

  const handleQueryChange = useCallback((val) => {
    setQuery(val);
    // If search is cleared, don't deselect the active article
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0F1923] overflow-hidden">

      {/* ── Sticky top search bar ──────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-200 dark:border-[#243348] bg-white dark:bg-[#131F2E]">
        <div className="max-w-xl">
          <SearchBar
            query={query}
            onChange={handleQueryChange}
            inputRef={searchInputRef}
            placeholder="Search help articles…"
          />
        </div>
      </div>

      {/* ── Body: left nav + right panel ──────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Left nav */}
        <aside className="w-[240px] shrink-0 border-r border-gray-200 dark:border-[#243348] bg-white dark:bg-[#131F2E] overflow-y-auto">
          <div className="py-3 px-2 space-y-0.5">
            {query.length > 0 ? (
              <>
                <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#7D93AE]">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{query}"
                </p>
                <SearchResults
                  results={searchResults}
                  activeArticle={activeArticle}
                  onSelectArticle={selectArticle}
                />
              </>
            ) : (
              HELP_CONTENT.map((cat) => (
                <NavCategory
                  key={cat.id}
                  category={cat}
                  isOpen={!!openCategories[cat.id]}
                  activeArticle={activeArticle}
                  onToggle={() => toggleCategory(cat.id)}
                  onSelectArticle={selectArticle}
                />
              ))
            )}
          </div>
        </aside>

        {/* Right panel */}
        <main
          ref={rightPanelRef}
          className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0F1923]"
        >
          {activeArticle ? (
            <ArticlePanel
              articleId={activeArticle}
              onBack={handleBack}
            />
          ) : (
            <HeroPanel
              onQuickCardClick={selectArticle}
              searchInputRef={searchInputRef}
            />
          )}
        </main>

      </div>
    </div>
  );
}
