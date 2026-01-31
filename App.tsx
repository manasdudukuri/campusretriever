import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ReportItem from './pages/ReportItem';
import SmartMatch from './pages/SmartMatch';
import AboutTeam from './pages/AboutTeam';
import CameraTracking from './pages/CameraTracking';
import { Item, ItemType, ViewState, ItemCategory, ResolutionDetails, ClaimRequest, Notification, CampusHub, ClassSession } from './types';
import { XIcon, MapPinIcon } from './components/Icons';

// --- MOCK DATA ---

const CAMPUS_HUBS: CampusHub[] = [
  { id: '1', name: 'Main Library Desk', description: 'Central check-in desk', mapLink: 'https://maps.google.com' },
  { id: '2', name: 'Student Union Admin', description: 'Room 202', mapLink: 'https://maps.google.com' },
  { id: '3', name: 'Security Office', description: 'Building C, Ground Floor', mapLink: 'https://maps.google.com' },
  { id: '4', name: 'Engineering Block Reception', description: 'North Entrance', mapLink: 'https://maps.google.com' },
];

const CLASS_SCHEDULE: ClassSession[] = [
  { room: 'Lab B', startTime: '10:00', endTime: '12:00', subject: 'Physics 101' },
  { room: 'Main Library', startTime: '09:00', endTime: '18:00', subject: 'Study Hall' },
  { room: 'Auditorium 1', startTime: '09:00', endTime: '10:30', subject: 'Intro to Engineering' },
  { room: 'Gym', startTime: '14:00', endTime: '16:00', subject: 'Basketball Practice' },
];

// Demo Data Generator
const generateDemoData = (): Item[] => [
  {
    id: '1',
    type: ItemType.LOST,
    title: 'MacBook Pro 14"',
    description: 'Silver MacBook Pro with a "NASA" sticker on the lid. Left it in the library study room 304.',
    category: ItemCategory.ELECTRONICS,
    condition: 'Used (Good)',
    location: 'Main Library',
    date: '2023-10-25',
    contactName: 'John Doe',
    contactEmail: 'john.d@srmap.edu',
    status: 'OPEN',
    aiTags: ['laptop', 'silver', 'apple', 'sticker', 'electronics'],
    imageUrl: 'https://picsum.photos/400/300?random=1',
    isUrgent: true,
    isHighValue: true,
  },
  {
    id: '2',
    type: ItemType.FOUND,
    title: 'Silver Laptop',
    description: 'Found a silver laptop on a desk in the quiet study area. Has a space sticker.',
    category: ItemCategory.ELECTRONICS,
    condition: 'Like New',
    location: 'Main Library',
    date: '2023-10-25',
    contactName: 'Librarian Desk',
    contactEmail: 'lostfound@srmap.edu',
    status: 'OPEN',
    aiTags: ['laptop', 'silver', 'computer', 'macbook'],
    imageUrl: 'https://picsum.photos/400/300?random=2',
    isMovedToHub: true,
    dropOffHubId: '1',
    isHighValue: true,
    // Zero-Knowledge Quiz Demo
    quizQuestion: 'What text is on the sticker on the lid?',
    quizOptions: ['NASA', 'SpaceX', 'Apple Logo'],
    quizCorrectAnswer: 'NASA'
  },
];

const NotificationsModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  notifications: Notification[];
  claims: ClaimRequest[];
  onApproveClaim: (claimId: string) => void;
  onRejectClaim: (claimId: string) => void;
  onMarkRead: (id: string) => void;
}> = ({ isOpen, onClose, notifications, claims, onApproveClaim, onRejectClaim, onMarkRead }) => {
  if (!isOpen) return null;
  const pendingClaims = claims.filter(c => c.status === 'PENDING');

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">Notifications</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><XIcon className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-4 space-y-6">
          <section>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pending Claims</h3>
            {pendingClaims.length === 0 ? <p className="text-sm text-slate-400 italic">No pending claims.</p> : (
              <div className="space-y-4">
                {pendingClaims.map(claim => (
                  <div key={claim.id} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                       <p className="text-sm font-medium text-amber-900">Claim for: {claim.itemTitle}</p>
                       {claim.quizPassed && <span className="bg-green-100 text-green-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-200">Quiz Passed</span>}
                    </div>
                    <div className="text-sm text-amber-800 space-y-2 mb-3">
                      <p><span className="font-semibold">Claimant:</span> {claim.claimantName}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => onApproveClaim(claim.id)} className="flex-1 bg-green-600 text-white text-xs font-bold py-2 px-2 rounded hover:bg-green-700">Approve & Send PIN</button>
                      <button onClick={() => onRejectClaim(claim.id)} className="flex-1 bg-white border border-slate-300 text-slate-700 text-xs font-bold py-2 px-2 rounded hover:bg-slate-50">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section>
             <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Alerts</h3>
             {notifications.length === 0 ? <p className="text-sm text-slate-400 italic">No new notifications.</p> : (
               <div className="space-y-2">
                 {notifications.map(notif => (
                   <div key={notif.id} className={`p-3 rounded-lg border text-sm ${notif.read ? 'bg-slate-50 border-slate-100 text-slate-500' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
                      <div className="flex justify-between items-start">
                        <h4 className={`font-semibold ${notif.type === 'URGENCY_ALERT' || notif.type === 'SAFETY_TIMER' || notif.type === 'FRAUD_ALERT' ? 'text-red-700' : ''}`}>{notif.title}</h4>
                        {!notif.read && <button onClick={() => onMarkRead(notif.id)} className="text-xs text-blue-600 hover:underline">Mark read</button>}
                      </div>
                      <p className="mt-1">{notif.message}</p>
                   </div>
                 ))}
               </div>
             )}
          </section>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('campusItems');
    return saved ? JSON.parse(saved) : generateDemoData();
  });
  const [claims, setClaims] = useState<ClaimRequest[]>(() => {
    const saved = localStorage.getItem('campusClaims');
    return saved ? JSON.parse(saved) : [];
  });
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('campusNotifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [userReputation, setUserReputation] = useState<number>(() => {
    const saved = localStorage.getItem('userReputation');
    return saved ? parseInt(saved, 10) : 100;
  });
  
  // Security State: Failed Claim Attempts per Item
  const [failedClaimAttempts, setFailedClaimAttempts] = useState<Record<string, number>>({});

  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Derived state to fix selectedItem error
  const selectedItem = items.find(i => i.id === selectedItemId);
  
  // Handshake State
  const [activeHandshakeItem, setActiveHandshakeItem] = useState<Item | null>(null);
  const [handshakePin, setHandshakePin] = useState('');
  const [isNearSafeZone, setIsNearSafeZone] = useState(false);

  useEffect(() => { localStorage.setItem('campusItems', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('campusClaims', JSON.stringify(claims)); }, [claims]);
  useEffect(() => { localStorage.setItem('campusNotifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('userReputation', userReputation.toString()); }, [userReputation]);

  const handleAddItem = (newItemData: Omit<Item, 'id' | 'status'>) => {
    const newItem: Item = { ...newItemData, id: Math.random().toString(36).substr(2, 9), status: 'OPEN' };
    setItems(prev => [newItem, ...prev]);
    setSelectedItemId(newItem.id);
    setCurrentView('MATCHES');
  };

  const handleSelectItem = (item: Item) => { setSelectedItemId(item.id); setCurrentView('MATCHES'); };
  
  const handleResolveItem = (itemId: string, details: ResolutionDetails) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: 'RESOLVED', resolutionDetails: details };
      }
      return item;
    }));
    setActiveHandshakeItem(null);
  };

  const handleSubmitClaim = (request: Omit<ClaimRequest, 'id' | 'timestamp' | 'status'>) => {
    const newClaim: ClaimRequest = { ...request, id: Date.now().toString(), status: 'PENDING', timestamp: new Date().toISOString() };
    setClaims(prev => [newClaim, ...prev]);
    alert("Zero-Knowledge Claim sent! The finder will review your quiz result.");
  };

  const handleApproveClaim = (claimId: string) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;
    
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: 'APPROVED' } : c));
    const item = items.find(i => i.id === claim.itemId);
    
    if (item) {
        // High Value = Escrow Mode (No PIN, just instruction)
        if (item.isHighValue) {
             setNotifications(prev => [{ id: Date.now().toString(), type: 'CLAIM_UPDATE', title: 'Claim Approved - ESCROW REQUIRED', message: 'High Value Item. Please proceed to the Security Hub for handoff.', read: false }, ...prev]);
             handleResolveItem(item.id, { resolvedBy: claim.claimantName, contactInfo: claim.claimantContact, resolutionDate: new Date().toISOString(), exchangeMethod: 'SECURITY_ESCROW' });
        } else {
             // Standard P2P = Dual Token Handshake
             const pin = Math.floor(1000 + Math.random() * 9000).toString();
             const updatedItem = { ...item, exchangePin: pin, status: 'PENDING_PICKUP' as const }; // Using type assertion for string literal
             setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
             
             setNotifications(prev => [{ id: Date.now().toString(), type: 'CLAIM_UPDATE', title: 'Claim Approved - HANDSHAKE', message: `Meeting PIN generated: ${pin}. Share this with the finder ONLY when meeting.`, read: false }, ...prev]);
             setActiveHandshakeItem(updatedItem);
        }
    }
  };
  
  const handleRejectClaim = (id: string) => setClaims(prev => prev.map(c => c.id === id ? { ...c, status: 'REJECTED' } : c));
  const handleMarkNotifRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const handleQuizFail = (itemId: string) => {
    const currentFails = failedClaimAttempts[itemId] || 0;
    const newFails = currentFails + 1;
    setFailedClaimAttempts(prev => ({ ...prev, [itemId]: newFails }));

    // Reputation Penalty
    setUserReputation(prev => Math.max(0, prev - 10));

    if (newFails >= 2) {
       setNotifications(prev => [{ id: Date.now().toString(), type: 'FRAUD_ALERT', title: 'Security Alert: Account Flagged', message: 'Two failed claim attempts detected. You have been locked out of this item.', read: false }, ...prev]);
    }
  };

  const verifyHandshake = () => {
    if (activeHandshakeItem && activeHandshakeItem.exchangePin === handshakePin) {
      if (!isNearSafeZone) {
         alert("Geofencing Alert: You are not within a Safe Exchange Zone (e.g., Library). Please move to a safe location.");
         return;
      }
      handleResolveItem(activeHandshakeItem.id, { 
        resolvedBy: 'Verified Claimant', 
        contactInfo: 'Verified via PIN', 
        resolutionDate: new Date().toISOString(),
        exchangeMethod: 'P2P_PIN'
      });
      setUserReputation(prev => prev + 25);
      alert("Handshake Confirmed! Item marked as resolved.");
    } else {
      alert("Invalid PIN. Do not hand over the item.");
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD': return <Dashboard items={items} onSelectItem={handleSelectItem} />;
      case 'REPORT_LOST': return <ReportItem type={ItemType.LOST} onSubmit={handleAddItem} onCancel={() => setCurrentView('DASHBOARD')} campusHubs={CAMPUS_HUBS} />;
      case 'REPORT_FOUND': return <ReportItem type={ItemType.FOUND} onSubmit={handleAddItem} onCancel={() => setCurrentView('DASHBOARD')} campusHubs={CAMPUS_HUBS} />;
      case 'MATCHES': return selectedItem ? <SmartMatch item={selectedItem} allItems={items} onResolve={handleResolveItem} onSubmitClaim={handleSubmitClaim} onBack={() => { setSelectedItemId(null); setCurrentView('DASHBOARD'); }} campusHubs={CAMPUS_HUBS} classSchedule={CLASS_SCHEDULE} failedAttempts={selectedItem ? (failedClaimAttempts[selectedItem.id] || 0) : 0} onQuizFail={handleQuizFail} /> : <Dashboard items={items} onSelectItem={handleSelectItem} />;
      case 'ABOUT': return <AboutTeam />;
      case 'CAMERA_TRACKING': return <CameraTracking lostItems={items.filter(i => i.type === ItemType.LOST && i.status === 'OPEN')} />;
      default: return <Dashboard items={items} onSelectItem={handleSelectItem} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative">
      <Navbar currentView={currentView} setView={setCurrentView} reputation={userReputation} notificationCount={notifications.filter(n => !n.read).length} onOpenNotifications={() => setShowNotifications(true)} />
      <main className="pb-12">{renderContent()}</main>

      {/* Handshake Banner */}
      {activeHandshakeItem && (
        <div className="fixed bottom-0 left-0 right-0 bg-brand-700 text-white p-4 shadow-lg z-50">
           <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center">
             <div className="mb-2 sm:mb-0">
               <h3 className="font-bold text-lg flex items-center"><span className="mr-2">🤝</span> Handshake Protocol Active</h3>
               <p className="text-sm text-brand-100">Ask the claimant for the 4-digit PIN.</p>
               <div className="flex items-center mt-1 text-xs">
                 <span className={`h-2 w-2 rounded-full mr-1 ${isNearSafeZone ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`}></span>
                 {isNearSafeZone ? "Safe Zone Detected" : "Outside Safe Zone"}
                 <button onClick={() => setIsNearSafeZone(!isNearSafeZone)} className="ml-2 underline opacity-50 hover:opacity-100">(Simulate GPS)</button>
               </div>
             </div>
             <div className="flex gap-2">
               <input type="text" placeholder="PIN" maxLength={4} value={handshakePin} onChange={e => setHandshakePin(e.target.value)} className="w-20 px-2 py-1 text-slate-900 rounded text-center font-mono font-bold tracking-widest" />
               <button onClick={verifyHandshake} className="bg-brand-900 hover:bg-slate-900 px-4 py-2 rounded text-sm font-bold shadow-md border border-brand-500">Verify & Handover</button>
             </div>
           </div>
        </div>
      )}

      <NotificationsModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} notifications={notifications} claims={claims} onApproveClaim={handleApproveClaim} onRejectClaim={handleRejectClaim} onMarkRead={handleMarkNotifRead} />
    </div>
  );
};

export default App;