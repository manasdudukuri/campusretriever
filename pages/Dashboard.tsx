
import React, { useState } from 'react';
import { Item, ItemType, ItemCategory } from '../types';
import { MapPinIcon, SearchIcon, AlertCircleIcon, ChartBarIcon, XIcon, SparklesIcon } from '../components/Icons';
import { searchItemsSemantically } from '../services/geminiService';

interface DashboardProps {
  items: Item[];
  onSelectItem: (item: Item) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ items, onSelectItem }) => {
  const [filterType, setFilterType] = useState<'ALL' | ItemType>('ALL');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showResolved, setShowResolved] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // AI Search State
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);

  const handleAiSearch = async () => {
    if (!search.trim()) {
      setAiMatchedIds(null);
      return;
    }
    
    setIsAiSearching(true);
    try {
      const ids = await searchItemsSemantically(search, items);
      setAiMatchedIds(ids);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiSearching(false);
    }
  };

  const clearSearch = () => {
    setSearch('');
    setAiMatchedIds(null);
  };

  // Feature: Efficient Tagging Search & AI Semantic Search
  const filteredItems = items.filter(item => {
    const matchesStatus = showResolved ? true : item.status === 'OPEN';
    const matchesType = filterType === 'ALL' || item.type === filterType;
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    
    let matchesSearch = true;
    
    if (aiMatchedIds !== null) {
      // AI Search Mode: strict filter based on AI results
      matchesSearch = aiMatchedIds.includes(item.id);
    } else if (search) {
      // Standard Text Mode
      const searchLower = search.toLowerCase();
      matchesSearch = 
        item.title.toLowerCase().includes(searchLower) || 
        item.description.toLowerCase().includes(searchLower) ||
        item.location.toLowerCase().includes(searchLower) ||
        item.aiTags.some(tag => tag.toLowerCase().includes(searchLower));
    }

    return matchesStatus && matchesType && matchesCategory && matchesSearch;
  });

  // Sort: Urgent items first
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Analytics Logic
  const generateAnalytics = () => {
    const locations: Record<string, number> = {};
    const categories: Record<string, number> = {};
    
    items.forEach(i => {
      // Normalize location
      const loc = i.location.split(' ')[0] || 'Unknown'; 
      locations[loc] = (locations[loc] || 0) + 1;
      categories[i.category] = (categories[i.category] || 0) + 1;
    });

    const topLocations = Object.entries(locations).sort((a, b) => b[1] - a[1]).slice(0, 4);
    
    return { topLocations, categories };
  };

  const analyticsData = generateAnalytics();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Campus Activity</h1>
          <p className="text-slate-500 mt-1">Real-time lost and found updates</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <button 
             onClick={() => setShowAnalytics(!showAnalytics)}
             className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${showAnalytics ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}
          >
            <ChartBarIcon className="w-4 h-4" />
            <span>{showAnalytics ? 'Hide Analytics' : 'Predictive Heatmap'}</span>
          </button>

          <label className="flex items-center space-x-2 text-sm text-slate-600 mr-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showResolved} 
              onChange={e => setShowResolved(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Show Resolved</span>
          </label>

          <div className="relative group min-w-[280px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isAiSearching ? (
                 <span className="animate-spin h-5 w-5 text-brand-500 flex items-center justify-center">↻</span>
              ) : (
                 <SearchIcon className={`h-5 w-5 ${aiMatchedIds ? 'text-brand-500' : 'text-slate-400'}`} />
              )}
            </div>
            <input
              type="text"
              placeholder={aiMatchedIds ? "Filtering by AI Match..." : "Search items..."}
              value={search}
              onChange={(e) => {
                 setSearch(e.target.value);
                 if (aiMatchedIds) setAiMatchedIds(null); // Reset AI filter on type
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              className={`pl-10 pr-10 py-2 border rounded-md focus:ring-brand-500 focus:border-brand-500 block w-full sm:text-sm transition-all ${aiMatchedIds ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50' : 'border-slate-300'}`}
            />
            <button 
               onClick={aiMatchedIds ? clearSearch : handleAiSearch}
               className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
               title={aiMatchedIds ? "Clear Search" : "AI Smart Search"}
            >
               {aiMatchedIds ? (
                  <XIcon className="h-4 w-4 text-slate-400 hover:text-slate-600" />
               ) : (
                  <SparklesIcon className={`h-5 w-5 hover:scale-110 transition-transform ${search ? 'text-brand-500' : 'text-slate-300'}`} />
               )}
            </button>
          </div>
          
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
          >
            <option value="ALL">All Categories</option>
            {Object.values(ItemCategory).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="mb-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-xl animate-in slide-in-from-top duration-300">
           <div className="flex justify-between items-start mb-6">
             <div>
               <h3 className="text-xl font-bold flex items-center"><span className="text-2xl mr-2">📊</span> Campus Predictive Analytics</h3>
               <p className="text-slate-400 text-sm">AI-driven insights on loss hotspots and category trends.</p>
             </div>
             <button onClick={() => setShowAnalytics(false)} className="text-slate-400 hover:text-white"><XIcon className="w-5 h-5"/></button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Heatmap Simulation */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                 <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">High-Risk Zones (Heatmap)</h4>
                 <div className="space-y-3">
                    {analyticsData.topLocations.map(([loc, count], idx) => {
                       const percentage = Math.min(100, (count / items.length) * 100 * 3); // Amplify for visual
                       return (
                         <div key={loc} className="relative">
                           <div className="flex justify-between text-sm mb-1">
                             <span className="font-medium">{loc}</span>
                             <span className="text-slate-400">{count} reports</span>
                           </div>
                           <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : 'bg-yellow-500'}`} 
                                style={{ width: `${percentage}%` }}
                              ></div>
                           </div>
                         </div>
                       )
                    })}
                 </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">Item Category Distribution</h4>
                <div className="flex flex-wrap gap-2">
                   {Object.entries(analyticsData.categories).map(([cat, count]) => (
                      <div key={cat} className="bg-slate-700/50 px-3 py-2 rounded border border-slate-600 flex flex-col items-center min-w-[80px]">
                         <span className="text-xl font-bold text-indigo-400">{count}</span>
                         <span className="text-xs text-slate-300">{cat}</span>
                      </div>
                   ))}
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilterType('ALL')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              filterType === 'ALL' 
                ? 'border-brand-500 text-brand-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilterType(ItemType.LOST)}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              filterType === ItemType.LOST 
                ? 'border-red-500 text-red-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Lost
          </button>
          <button
            onClick={() => setFilterType(ItemType.FOUND)}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              filterType === ItemType.FOUND 
                ? 'border-green-500 text-green-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Found
          </button>
        </nav>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedItems.map(item => (
          <div 
            key={item.id} 
            onClick={() => onSelectItem(item)}
            className={`group bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${item.status === 'RESOLVED' ? 'opacity-60 grayscale' : ''} ${item.isUrgent && item.status === 'OPEN' ? 'ring-2 ring-red-400' : ''}`}
          >
            <div className="aspect-w-16 aspect-h-9 h-48 bg-slate-100 relative overflow-hidden">
              {item.imageUrl ? (
                <>
                  <img src={item.imageUrl} alt={item.title} className={`object-cover w-full h-full group-hover:scale-105 transition-transform duration-300 ${item.ocrDetectedText ? 'blur-md scale-110' : ''}`} />
                  {/* Privacy Mask Overlay */}
                  {item.ocrDetectedText && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                       <div className="bg-slate-900/80 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center backdrop-blur-sm border border-slate-700">
                          <AlertCircleIcon className="w-3 h-3 mr-1" />
                          Sensitive Info Hidden
                       </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <span className="text-sm">No Image</span>
                </div>
              )}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide text-white self-start ${
                  item.type === ItemType.LOST ? 'bg-red-500' : 'bg-green-500'
                }`}>
                  {item.type}
                </div>
                {/* Urgency Badge */}
                {item.isUrgent && item.status === 'OPEN' && (
                   <div className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wide text-white bg-red-600 animate-pulse self-start flex items-center">
                     <span className="mr-1">⚡</span> URGENT
                   </div>
                )}
                {item.status === 'RESOLVED' && (
                  <div className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wide text-white bg-slate-600 self-start">
                    RESOLVED
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                   <p className="text-xs text-slate-500 mb-1">{item.category}</p>
                   <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">{item.title}</h3>
                </div>
                <span className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</span>
              </div>
              
              <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                {item.description}
              </p>
              
              <div className="mt-4 flex items-center text-sm text-slate-500">
                <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                <span className="line-clamp-1">{item.location}</span>
              </div>
              
              {/* Feature: Efficient Tagging Visual */}
              {item.aiTags && item.aiTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {item.aiTags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {sortedItems.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-slate-400 text-lg">
              {aiMatchedIds !== null ? "No AI matches found. Try a different query." : "No items found matching your criteria."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
