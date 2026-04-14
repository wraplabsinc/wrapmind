import { useState } from 'react';
import { useMarketing } from '../../context/MarketingContext';
import ReviewsTab from './tabs/ReviewsTab';
import LeadsTab from './tabs/LeadsTab';
import FollowUpsTab from './tabs/FollowUpsTab';
import CampaignsTab from './tabs/CampaignsTab';
import GalleryTab from './tabs/GalleryTab';
import ReferralsTab from './tabs/ReferralsTab';
import AnalyticsTab from './tabs/AnalyticsTab';

const TABS = [
  { id: 'reviews',    label: 'Reviews' },
  { id: 'leads',      label: 'Leads' },
  { id: 'followups',  label: 'Follow-ups' },
  { id: 'campaigns',  label: 'Campaigns' },
  { id: 'gallery',    label: 'Gallery' },
  { id: 'referrals',  label: 'Referrals' },
  { id: 'analytics',  label: 'Analytics' },
];

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState('reviews');
  const { reviews, leads, campaigns } = useMarketing();

  const reviewsSent = reviews.length;
  const totalLeads = leads.filter(l => !l._deleted).length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--wm-bg-primary)]">
      {/* Page header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-0 border-b border-[var(--wm-bg-border)] bg-[var(--wm-bg-secondary)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[#0F1923] dark:text-[#F8FAFE] tracking-tight">Marketing</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/25 tracking-wider uppercase">
              Experimental
            </span>
          </div>
          {/* Summary stats */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-gray-400">Reviews sent</p>
              <p className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">{reviewsSent}</p>
            </div>
            <div className="w-px h-8 bg-[var(--wm-bg-border)]" />
            <div className="text-right">
              <p className="text-[10px] text-gray-400">Leads</p>
              <p className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">{totalLeads}</p>
            </div>
            <div className="w-px h-8 bg-[var(--wm-bg-border)]" />
            <div className="text-right">
              <p className="text-[10px] text-gray-400">Active campaigns</p>
              <p className="text-sm font-bold text-[#0F1923] dark:text-[#F8FAFE]">{activeCampaigns}</p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[var(--wm-bg-border)] -mb-px overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'reviews'   && <ReviewsTab />}
        {activeTab === 'leads'     && <LeadsTab />}
        {activeTab === 'followups' && <FollowUpsTab />}
        {activeTab === 'campaigns' && <CampaignsTab />}
        {activeTab === 'gallery'   && <GalleryTab />}
        {activeTab === 'referrals' && <ReferralsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>
    </div>
  );
}
