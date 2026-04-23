import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { recordEstimateOutcome } from '../lib/learningAgent';
import { useLocations } from './LocationContext';
import { useAuth } from './AuthContext.jsx';
import { uuid } from '../lib/uuid.js';
import {
  USE_ESTIMATES,
  USE_ESTIMATE,
  USE_CREATE_ESTIMATE,
  USE_UPDATE_ESTIMATE,
  USE_DELETE_ESTIMATE,
} from '../api/estimates.graphql.js';

const STORAGE_KEY = 'wm-estimates-v1';

function deriveEstimatePrefix(org) {
  if (org?.settings?.estimatePrefix) return org.settings.estimatePrefix;
  if (org?.slug) return org.slug.split('-').map(w => w[0]?.toUpperCase() || '').join('');
  return 'WM';
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_ESTIMATES = [
  {
    id: 'est-001', locationId: 'loc-001', estimateNumber: 'WM-0001',
    status: 'converted', customerId: 'c001', customerName: 'Marcus Bell',
    customerPhone: '(310) 555-0142', customerEmail: 'marcus.bell@email.com',
    vehicleId: 'v001', vehicleLabel: '2023 Tesla Model 3', vehicleVin: '5YJ3E1EA1PF123456',
    package: 'Full Wrap', material: '3M 1080 Series', materialColor: 'Matte Charcoal',
    laborHours: 18, basePrice: 2800, laborCost: 900, materialCost: 650, discount: 0, total: 4350,
    notes: 'Customer wants matte finish. Handle charge port area carefully.',
    createdBy: 'Alex R.', assignedTo: 'Jamie K.',
    createdAt: '2025-01-15T09:00:00Z', sentAt: '2025-01-16T10:00:00Z',
    expiresAt: '2025-02-15T00:00:00Z', approvedAt: '2025-01-20T14:00:00Z',
    declinedAt: null, convertedToInvoice: true, invoiceId: 'inv-0041',
  },
  {
    id: 'est-002', locationId: 'loc-001', estimateNumber: 'WM-0002',
    status: 'approved', customerId: 'c002', customerName: 'Devon Walsh',
    customerPhone: '(424) 555-0293', customerEmail: 'devon.walsh@email.com',
    vehicleId: 'v002', vehicleLabel: '2022 BMW M4', vehicleVin: 'WBS43AY01NCK98765',
    package: 'Full Wrap', material: 'Avery Dennison SW900', materialColor: 'Satin Black',
    laborHours: 20, basePrice: 3200, laborCost: 1000, materialCost: 720, discount: 150, total: 4770,
    notes: 'Full satin black, schedule confirmed.',
    createdBy: 'Jamie K.', assignedTo: 'Alex R.',
    createdAt: '2025-01-22T11:00:00Z', sentAt: '2025-01-23T09:30:00Z',
    expiresAt: '2025-02-22T00:00:00Z', approvedAt: '2025-01-25T16:45:00Z',
    declinedAt: null, convertedToInvoice: false, invoiceId: null,
  },
  {
    id: 'est-003', locationId: 'loc-001', estimateNumber: 'WM-0003',
    status: 'sent', customerId: 'c003', customerName: 'Tina Marsh',
    customerPhone: '(818) 555-0381', customerEmail: 'tina.marsh@email.com',
    vehicleId: 'v003', vehicleLabel: '2021 Ford F-150 Raptor', vehicleVin: '1FTFW1RG9MFC87321',
    package: 'Hood & Roof', material: '3M 2080 Series', materialColor: 'Gloss White',
    laborHours: 10, basePrice: 1400, laborCost: 500, materialCost: 380, discount: 0, total: 2280,
    notes: 'Partial roof + hood. Surface in good condition from prior removal.',
    createdBy: 'Sam T.', assignedTo: 'Sam T.',
    createdAt: '2025-02-10T08:00:00Z', sentAt: '2025-02-11T09:00:00Z',
    expiresAt: '2025-03-13T00:00:00Z', approvedAt: null,
    declinedAt: null, convertedToInvoice: false, invoiceId: null,
  },
  {
    id: 'est-004', locationId: 'loc-001', estimateNumber: 'WM-0004',
    status: 'declined', customerId: 'c004', customerName: 'Kyle Huang',
    customerPhone: '(213) 555-0458', customerEmail: 'kyle.huang@email.com',
    vehicleId: 'v004', vehicleLabel: '2022 Porsche 911', vehicleVin: 'WP0AA2A99NS223344',
    package: 'Full Wrap', material: 'ORACAL 970RA', materialColor: 'Gloss Frozen Cherry',
    laborHours: 22, basePrice: 3600, laborCost: 1100, materialCost: 890, discount: 0, total: 5590,
    notes: 'Customer felt price was too high. Follow up in 30 days.',
    createdBy: 'Alex R.', assignedTo: 'Alex R.',
    createdAt: '2025-01-30T13:00:00Z', sentAt: '2025-01-31T10:00:00Z',
    expiresAt: '2025-03-01T00:00:00Z', approvedAt: null,
    declinedAt: '2025-02-05T17:30:00Z', convertedToInvoice: false, invoiceId: null,
  },
  {
    id: 'est-005', locationId: 'loc-001', estimateNumber: 'WM-0005',
    status: 'expired', customerId: 'c005', customerName: 'Jordan Lee',
    customerPhone: '(323) 555-0572', customerEmail: 'jordan.lee@email.com',
    vehicleId: 'v005', vehicleLabel: '2020 Jeep Wrangler', vehicleVin: '1C4HJXDG0LW123789',
    package: 'Partial Wrap', material: '3M 1080 Series', materialColor: 'Matte Military Green',
    laborHours: 12, basePrice: 1800, laborCost: 600, materialCost: 480, discount: 0, total: 2880,
    notes: 'Off-road accent graphics. Customer went silent after quote.',
    createdBy: 'Morgan L.', assignedTo: 'Morgan L.',
    createdAt: '2024-12-01T10:00:00Z', sentAt: '2024-12-02T11:00:00Z',
    expiresAt: '2025-01-01T00:00:00Z', approvedAt: null,
    declinedAt: null, convertedToInvoice: false, invoiceId: null,
  },
  {
    id: 'est-006', locationId: 'loc-001', estimateNumber: 'WM-0006',
    status: 'draft', customerId: 'c006', customerName: 'Priya Nair',
    customerPhone: '(714) 555-0614', customerEmail: 'priya.nair@email.com',
    vehicleId: 'v006', vehicleLabel: '2024 Honda CR-V', vehicleVin: '7FARW2H50RE012345',
    package: 'Full Wrap', material: 'Avery Dennison SW900', materialColor: 'Gloss Cosmic Blue',
    laborHours: 16, basePrice: 2600, laborCost: 800, materialCost: 610, discount: 0, total: 4010,
    notes: 'Color change from silver to cosmic blue. Awaiting final approval from customer.',
    createdBy: 'Jamie K.', assignedTo: 'Jamie K.',
    createdAt: '2025-03-05T14:00:00Z', sentAt: null,
    expiresAt: '2025-04-05T00:00:00Z', approvedAt: null,
    declinedAt: null, convertedToInvoice: false, invoiceId: null,
  },
  {
    id: 'est-007', locationId: 'loc-002', estimateNumber: 'WM-0007',
    status: 'sent', customerId: 'c007', customerName: 'Brett Tanaka',
    customerPhone: '(562) 555-0771', customerEmail: 'brett.tanaka@fleetco.com',
    vehicleId: 'v007', vehicleLabel: '2023 Ford Transit (Fleet)', vehicleVin: '1FTBR3X85PKA11111',
    package: 'Full Wrap', material: '3M 1080 Series', materialColor: 'Gloss White + Logo Overlay',
    laborHours: 24, basePrice: 4200, laborCost: 1200, materialCost: 980, discount: 420, total: 5960,
    notes: 'Fleet wrap — unit 1 of 4. Corporate branding with logo placement.',
    createdBy: 'Alex R.', assignedTo: 'Alex R.',
    createdAt: '2025-02-20T09:00:00Z', sentAt: '2025-02-21T08:30:00Z',
    expiresAt: '2025-03-23T00:00:00Z', approvedAt: null,
    declinedAt: null, convertedToInvoice: false, invoiceId: null,
  },
  {
    id: 'est-008', locationId: 'loc-002', estimateNumber: 'WM-0008',
    status: 'approved', customerId: 'c007', customerName: 'Brett Tanaka',
    customerPhone: '(562) 555-0771', customerEmail: 'brett.tanaka@fleetco.com',
    vehicleId: 'v008', vehicleLabel: '2023 Ford Transit (Fleet)', vehicleVin: '1FTBR3X85PKA22222',
    package: 'Full Wrap', material: '3M 1080 Series', materialColor: 'Gloss White + Logo Overlay',
    laborHours: 24, basePrice: 4200, laborCost: 1200, materialCost: 980, discount: 420, total: 5960,
    notes: 'Fleet wrap — unit 2 of 4. Approved, pending scheduling.',
    createdBy: 'Alex R.', assignedTo: 'Alex R.',
    createdAt: '2025-02-20T09:05:00Z', sentAt: '2025-02-21T08:35:00Z',
    expiresAt: '2025-03-23T00:00:00Z', approvedAt: '2025-02-25T11:00:00Z',
    declinedAt: null, convertedToInvoice: false, invoiceId: null,
  },
  {
    id: 'est-009', locationId: 'loc-002', estimateNumber: 'WM-0009',
    status: 'draft', customerId: 'c007', customerName: 'Brett Tanaka',
    customerPhone: '(562) 555-0771', customerEmail: 'brett.tanaka@fleetco.com',
    vehicleId: 'v009', vehicleLabel: '2023 Ford Transit (Fleet)', vehicleVin: '1FTBR3X85PKA33333',
    package: 'Full Wrap', material: '3M 1080 Series', materialColor: 'Gloss White + Logo Overlay',
    laborHours: 24, basePrice: 4200, laborCost: 1200, materialCost: 980, discount: 420, total: 5960,
    notes: 'Fleet wrap — unit 3 of 4. Draft in progress.',
    createdBy: 'Alex R.', assignedTo: 'Alex R.',
    createdAt: '2025-03-01T10:00:00Z', sentAt: null,
    expiresAt: '2025-04-01T00:00:00Z', approvedAt: null,
    declinedAt: null, convertedToInvoice: false, invoiceId: null,
  },
  {
    id: 'est-010', locationId: 'loc-002', estimateNumber: 'WM-0010',
    status: 'draft', customerId: 'c007', customerName: 'Brett Tanaka',
    customerPhone: '(562) 555-0771', customerEmail: 'brett.tanaka@fleetco.com',
    vehicleId: 'v010', vehicleLabel: '2023 Ford Transit (Fleet)', vehicleVin: '1FTBR3X85PKA44444',
    package: 'Full Wrap', material: '3M 1080 Series', materialColor: 'Gloss White + Logo Overlay',
    laborHours: 24, basePrice: 4200, laborCost: 1200, materialCost: 980, discount: 420, total: 5960,
    notes: 'Fleet wrap — unit 4 of 4. Not started yet.',
    createdBy: 'Alex R.', assignedTo: 'Unassigned',
    createdAt: '2025-03-01T10:10:00Z', sentAt: null,
    expiresAt: '2025-04-01T00:00:00Z', approvedAt: null,
    declinedAt: null, convertedToInvoice: false, invoiceId: null,
  },
  {
    id: 'est-011', locationId: 'loc-002', estimateNumber: 'WM-0011',
    status: 'sent', customerId: 'c008', customerName: 'Destiny Monroe',
    customerPhone: '(626) 555-0832', customerEmail: 'destiny.monroe@email.com',
    vehicleId: 'v011', vehicleLabel: '2023 Audi RS5', vehicleVin: 'WUAPEWF58PA001122',
    package: 'Racing Stripes', material: 'ORACAL 651', materialColor: 'Gloss Neon Yellow',
    laborHours: 6, basePrice: 800, laborCost: 300, materialCost: 220, discount: 0, total: 1320,
    notes: 'Dual racing stripes hood to trunk. Customer wants precision placement.',
    createdBy: 'Sam T.', assignedTo: 'Sam T.',
    createdAt: '2025-03-10T15:00:00Z', sentAt: '2025-03-11T09:00:00Z',
    expiresAt: '2025-04-10T00:00:00Z', approvedAt: null,
    declinedAt: null, convertedToInvoice: false, invoiceId: null,
  },
  {
    id: 'est-012', locationId: 'loc-002', estimateNumber: 'WM-0012',
    status: 'draft', customerId: 'c009', customerName: 'Sam Okafor',
    customerPhone: '(415) 555-0991', customerEmail: 'sam.okafor@email.com',
    vehicleId: 'v012', vehicleLabel: '2024 Dodge Challenger', vehicleVin: '2C3CDZBT5RH123456',
    package: 'Partial Wrap', material: 'Avery Dennison SW900', materialColor: 'Matte Carbon Fiber',
    laborHours: 14, basePrice: 2100, laborCost: 700, materialCost: 560, discount: 100, total: 3260,
    notes: 'Carbon fiber hood, roof, and trunk. Customer wants chrome delete too.',
    createdBy: 'Morgan L.', assignedTo: 'Morgan L.',
    createdAt: '2025-03-18T11:00:00Z', sentAt: null,
    expiresAt: '2025-04-18T00:00:00Z', approvedAt: null,
    declinedAt: null, convertedToInvoice: false, invoiceId: null,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return SEED_ESTIMATES;
}

function saveToStorage(estimates) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(estimates)); } catch { /* ignore */ }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const EstimateContext = createContext(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function EstimateProvider({ children }) {
  const { activeLocationId } = useLocations();
  const { orgId, org } = useAuth();

  // Apollo GraphQL: all estimates for the org
  const { estimates: apolloEstimates, loading: apolloLoading, error: apolloError, refetch } =
    USE_ESTIMATES({ orgId, first: 300 });

  // Track estimate outcomes for learning agent
  const recordedRef = useRef(new Set());

  const isDevAuth = import.meta.env.VITE_LOCAL_DEV === '1';
  const hasApolloData = !apolloLoading && !apolloError && apolloEstimates.length > 0;

  // Apollo owns the list once data arrives; dev mode always uses seed
  const [estimates, setEstimates] = useState(() => {
    if (isDevAuth) return SEED_ESTIMATES;
    if (hasApolloData) return apolloEstimates;
    return loadFromStorage();
  });

  // Sync Apollo data into state once available
  const initRef = useRef(false);
  useEffect(() => {
    if (isDevAuth) return;
    if (!initRef.current && hasApolloData) {
      initRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEstimates(apolloEstimates);
    }
  }, [hasApolloData, apolloEstimates, isDevAuth]);

  // Write-through: persist local state changes to localStorage
  useEffect(() => {
    if (!isDevAuth) saveToStorage(estimates);
  }, [estimates, isDevAuth]);

  // Learning agent: record terminal-state outcomes
  useEffect(() => {
    estimates.forEach(est => {
      if (
        ['approved', 'declined', 'converted'].includes(est.status) &&
        !recordedRef.current.has(est.id)
      ) {
        recordedRef.current.add(est.id);
        recordEstimateOutcome(est, est.status);
      }
    });
  }, [estimates]);

  // ─── Filtered view ─────────────────────────────────────────────────────────
  const filteredEstimates = activeLocationId === 'all' || !activeLocationId
    ? estimates
    : estimates.filter(e => !e.locationId || e.locationId === activeLocationId);

  // ─── getNextEstimateNumber ───────────────────────────────────────────────────
  const getNextEstimateNumber = useCallback(() => {
    const prefix = deriveEstimatePrefix(org);
    const maxNum = estimates.reduce((max, e) => {
      const n = parseInt(e.estimateNumber?.replace(/^[A-Z]+-/, '') || '0', 10);
      return n > max ? n : max;
    }, 0);
    return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
  }, [estimates, org]);

  // ─── Apollo mutations ───────────────────────────────────────────────────────
  // Fire-and-forget — optimistic updates already applied to local state
  const [createEstimateMutation] = USE_CREATE_ESTIMATE();
  const [updateEstimateMutation]  = USE_UPDATE_ESTIMATE();
  const [deleteEstimateMutation] = USE_DELETE_ESTIMATE();

  // ─── addEstimate ───────────────────────────────────────────────────────────
  const addEstimate = useCallback((estimateData = {}) => {
    const nextNumber = (() => {
      const prefix = deriveEstimatePrefix(org);
      const maxNum = estimates.reduce((max, e) => {
        const n = parseInt(e.estimateNumber?.replace(/^[A-Z]+-/, '') || '0', 10);
        return n > max ? n : max;
      }, 0);
      return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
    })();

    const newEst = {
      id: uuid(),
      estimateNumber: nextNumber,
      locationId: activeLocationId === 'all' ? 'loc-001' : activeLocationId,
      createdAt: new Date().toISOString(),
      status: 'draft',
      convertedToInvoice: false,
      invoiceId: null,
      ...estimateData,
    };

    // Optimistic update
    setEstimates(prev => [newEst, ...prev]);

    if (orgId && !isDevAuth) {
      createEstimateMutation({
        variables: {
          orgId,
          locationId:  newEst.locationId,
          customerId:  newEst.customerId,
          estimateNumber: newEst.estimateNumber,
          status:      newEst.status,
          package:     newEst.package     ?? null,
          material:    newEst.material    ?? null,
          materialColor: newEst.materialColor ?? null,
          laborHours:  newEst.laborHours  ?? 0,
          basePrice:   newEst.basePrice   ?? 0,
          laborCost:   newEst.laborCost   ?? 0,
          materialCost: newEst.materialCost ?? 0,
          discount:    newEst.discount    ?? 0,
          total:       newEst.total       ?? 0,
          notes:       newEst.notes       ?? null,
          assignedToId: newEst.assignedToId ?? null,
        },
      }).catch(err => console.error('[EstimateContext] GraphQL create failed:', err));
    }

    return newEst;
  }, [estimates, activeLocationId, orgId, org, isDevAuth, createEstimateMutation]);

  // ─── updateEstimate ─────────────────────────────────────────────────────────
  const updateEstimate = useCallback((id, patch) => {
    // Optimistic update
    setEstimates(prev =>
      prev.map(e => (e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e))
    );

    if (orgId && !isDevAuth) {
      updateEstimateMutation({ variables: { id, ...patch } })
        .catch(err => console.error('[EstimateContext] GraphQL update failed:', err));
    }
  }, [orgId, isDevAuth, updateEstimateMutation]);

  // ─── deleteEstimate ────────────────────────────────────────────────────────
  const deleteEstimate = useCallback((id) => {
    // Optimistic remove
    setEstimates(prev => prev.filter(e => e.id !== id));

    if (orgId && !isDevAuth) {
      deleteEstimateMutation({ variables: { id } })
        .catch(err => console.error('[EstimateContext] GraphQL delete failed:', err));
    }
  }, [orgId, isDevAuth, deleteEstimateMutation]);

  // ─── getEstimateById ────────────────────────────────────────────────────────
  const getEstimateById = useCallback((id) => {
    return estimates.find(e => e.id === id);
  }, [estimates]);

  // ─── Context value ─────────────────────────────────────────────────────────

  const value = {
    estimates:         filteredEstimates,   // scoped to active location
    allEstimates:      estimates,          // full list for aggregate views
    loading:           !isDevAuth && apolloLoading,
    error:             apolloError,
    refetch,
    addEstimate,
    updateEstimate,
    deleteEstimate,
    getEstimateById,
    getNextEstimateNumber,
    estimateCount:     filteredEstimates.length,
  };

  return (
    <EstimateContext.Provider value={value}>
      {children}
    </EstimateContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useEstimates() {
  const ctx = useContext(EstimateContext);
  if (!ctx) throw new Error('useEstimates must be used within EstimateProvider');
  return ctx;
}
