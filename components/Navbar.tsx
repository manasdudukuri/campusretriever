import React from 'react';
import { ViewState } from '../types';
import { CameraIcon } from './Icons';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  reputation: number;
  notificationCount: number;
  onOpenNotifications: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  currentView, 
  setView, 
  reputation, 
  notificationCount, 
  onOpenNotifications,
}) => {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => setView('DASHBOARD')}>
            <span className="text-2xl font-bold text-brand-600">CampusRetriever</span>
            <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-brand-100 text-brand-700">AI</span>
          </div>
          
          <div className="flex items-center space-x-4">
             {/* Reputation Display */}
            <div className="hidden md:flex items-center px-3 py-1 bg-amber-50 rounded-full border border-amber-100 text-amber-700 text-sm font-medium">
              <span className="mr-1">🏆</span>
              <span>Rep: {reputation}</span>
            </div>

            <button 
              onClick={() => setView('DASHBOARD')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${currentView === 'DASHBOARD' ? 'text-brand-600 bg-brand-50' : 'text-slate-600 hover:text-brand-600'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setView('CAMERA_TRACKING')}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${currentView === 'CAMERA_TRACKING' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-brand-600'}`}
            >
              <CameraIcon className="w-4 h-4" />
              <span>Campus Eye</span>
            </button>
            <button 
              onClick={() => setView('ABOUT')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${currentView === 'ABOUT' ? 'text-brand-600 bg-brand-50' : 'text-slate-600 hover:text-brand-600'}`}
            >
              About Team
            </button>
            <button 
              onClick={() => setView('REPORT_LOST')}
              className={`px-4 py-2 rounded-md text-sm font-bold shadow-sm transition-all transform hover:scale-105 ${
                currentView === 'REPORT_LOST' 
                  ? 'bg-red-700 text-white ring-2 ring-red-500 ring-offset-1' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Report Lost
            </button>
            <button 
              onClick={() => setView('REPORT_FOUND')}
              className={`px-4 py-2 rounded-md text-sm font-bold shadow-sm transition-all transform hover:scale-105 ${
                currentView === 'REPORT_FOUND' 
                  ? 'bg-green-700 text-white ring-2 ring-green-500 ring-offset-1' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Report Found
            </button>

            {/* Notification Bell */}
            <button 
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <span className="sr-only">View notifications</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold text-center leading-4 ring-2 ring-white">
                  {notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;