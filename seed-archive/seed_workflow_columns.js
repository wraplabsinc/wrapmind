export const DEFAULT_COLUMNS = [
  { id: 'active',    label: 'Active Estimates',     color: '#2E8BF0', canDelete: false },
  { id: 'deposit',   label: 'Waiting for Deposit',  color: '#F59E0B', canDelete: true  },
  { id: 'followup',  label: 'Follow Ups',           color: '#8B5CF6', canDelete: true  },
  { id: 'scheduled', label: 'Scheduled',            color: '#22C55E', canDelete: true  },
  { id: 'inprog',    label: 'In Progress',          color: '#06B6D4', canDelete: true  },
  { id: 'invoice',   label: 'Final Invoice',        color: '#F97316', canDelete: true  },
  { id: 'dead',      label: 'Work Done – Not Paid', color: '#EF4444', canDelete: true  },
  { id: 'complete',  label: 'Complete',             color: '#10B981', canDelete: false },
];
