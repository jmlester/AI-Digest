
import React from 'react';
import type { AiBrief, Headline, Tool, Tip } from '../types';
import { getHostname } from '../utils/url';
import { RefreshIcon, NewspaperIcon, BulbIcon, ToolIcon, LinkIcon, FileTextIcon, BarChart3Icon, CalendarDaysIcon, ChevronRightIcon } from './icons';

interface DashboardProps {
  data: AiBrief;
  onRegenerate: () => void;
}

const StoryCard: React.FC<{ item: Headline }> = ({ item }) => (
  <article className="bg-gray-800/50 rounded-lg border border-gray-700 p-5 flex flex-col h-full transition-all duration-300 hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-500/10">
    <h3 className="text-lg font-bold text-gray-100 mb-2">{item.headline}</h3>
    <p className="text-gray-400 text-sm mb-3 flex-grow">{item.summary}</p>
    <div className="text-xs bg-gray-700/50 rounded p-2 mb-4">
      <p className="font-semibold text-gray-300">Why it matters:</p>
      <p className="text-gray-400">{item.why_it_matters}</p>
    </div>
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-auto text-sm font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 group">
      <LinkIcon className="w-4 h-4" />
      <span>Read on {getHostname(item.url)}</span>
      <ChevronRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
    </a>
  </article>
);

const ItemCard: React.FC<{ item: Tool | Tip }> = ({ item }) => (
  <article className="bg-gray-800/50 rounded-lg border border-gray-700 p-5 flex flex-col h-full transition-all duration-300 hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-500/10">
    <h3 className="text-base font-bold text-gray-100 mb-2">{item.name}</h3>
    <p className="text-gray-400 text-sm mb-4 flex-grow">{item.description}</p>
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-auto text-sm font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 group">
      <LinkIcon className="w-4 h-4" />
      <span>Visit {getHostname(item.url)}</span>
       <ChevronRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
    </a>
  </article>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 flex items-center gap-4">
    <div className="bg-gray-700 rounded-full p-2 text-cyan-400">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  </div>
);

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <section className="mb-10">
    <div className="flex items-center gap-3 mb-4">
      <div className="text-cyan-400">{icon}</div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
    </div>
    {children}
  </section>
);

const Dashboard: React.FC<DashboardProps> = ({ data, onRegenerate }) => {
  const { top_headlines = [], tools_to_try = [], tips_to_try = [], quick_stats } = data;
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
       <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Daily AI Brief</h1>
          <p className="text-gray-400">Your personalized summary for {today}</p>
        </div>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 text-cyan-300 font-semibold py-2 px-4 rounded-full transition-colors duration-300 shrink-0"
          title="Regenerate Brief"
        >
          <RefreshIcon className="w-4 h-4" />
          <span>Regenerate</span>
        </button>
      </header>

      {quick_stats && (
         <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
           <StatCard icon={<FileTextIcon className="w-6 h-6"/>} label="Newsletters Scanned" value={quick_stats.newsletters_scanned} />
           <StatCard icon={<BarChart3Icon className="w-6 h-6"/>} label="Unique Sources" value={quick_stats.unique_sources} />
           <StatCard icon={<CalendarDaysIcon className="w-6 h-6"/>} label="Time Range" value={quick_stats.time_range} />
         </section>
      )}

      <Section title="Top Stories" icon={<NewspaperIcon className="w-7 h-7" />}>
        {top_headlines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {top_headlines.map((item) => <StoryCard key={item.url} item={item} />)}
          </div>
        ) : <p className="text-gray-500 italic ml-2">(No new stories today)</p>}
      </Section>
      
      <Section title="Tips to Try" icon={<BulbIcon className="w-7 h-7" />}>
         {tips_to_try.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tips_to_try.map((item) => <ItemCard key={item.url} item={item} />)}
            </div>
         ) : <p className="text-gray-500 italic ml-2">(No new tips today)</p>}
      </Section>

      <Section title="Tools to Discover" icon={<ToolIcon className="w-7 h-7" />}>
        {tools_to_try.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools_to_try.map((item) => <ItemCard key={item.url} item={item} />)}
          </div>
        ) : <p className="text-gray-500 italic ml-2">(No new tools to discover today)</p>}
      </Section>
    </div>
  );
};

export default Dashboard;
