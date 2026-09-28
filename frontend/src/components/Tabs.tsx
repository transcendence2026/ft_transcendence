interface Tab { id: string; label: string; }

export function Tabs({ tabs, activeTab, onChange }: { tabs: Tab[]; activeTab: string; onChange: (tab: string) => void }) {
  return <div className="flex gap-6 border-b border-border" role="tablist" aria-label="Profile sections">
    {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => onChange(tab.id)} className={`border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'border-primary text-text' : 'border-transparent text-muted hover:text-text'}`}>{tab.label}</button>)}
  </div>;
}