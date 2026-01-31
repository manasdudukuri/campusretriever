import React, { useEffect, useState, useRef } from 'react';
import { Item, ItemType, MatchResult, ResolutionDetails, ClaimRequest, CampusHub, ClassSession } from '../types';
import { findSmartMatches } from '../services/geminiService';
import { SparklesIcon, AlertCircleIcon, MailIcon, MapPinIcon } from '../components/Icons';

interface SmartMatchProps {
  item: Item;
  allItems: Item[];
  onBack: () => void;
  onResolve: (itemId: string, details: ResolutionDetails) => void;
  onSubmitClaim: (request: Omit<ClaimRequest, 'id' | 'timestamp' | 'status'>) => void;
  campusHubs: CampusHub[];
  classSchedule: ClassSession[];
  failedAttempts: number; // Feature: Two-Strike Rule
  onQuizFail: (itemId: string) => void;
}

// Internal Modal Component for Claiming
interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem: Item | null;
  referenceItem: Item;
  onConfirmResolve: (details: ResolutionDetails, alsoResolveReference: boolean) => void;
  onConfirmClaimRequest: (contact: string, name: string, image?: string, quizPassed?: boolean) => void;
  failedAttempts: number;
  onQuizFail: (itemId: string) => void;
}

const ClaimModal: React.FC<ClaimModalProps> = ({ isOpen, onClose, targetItem, referenceItem, onConfirmResolve, onConfirmClaimRequest, failedAttempts, onQuizFail }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [claimantImage, setClaimantImage] = useState<string | undefined>(undefined);
  const [alsoResolveRef, setAlsoResolveRef] = useState(false);
  
  // Zero-Knowledge Quiz State
  const [selectedQuizOption, setSelectedQuizOption] = useState('');
  const [quizError, setQuizError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setContact('');
      setNotes('');
      setSelectedQuizOption('');
      setQuizError(false);
      setClaimantImage(undefined);
      setAlsoResolveRef(false);
    }
  }, [isOpen]);

  if (!isOpen || !targetItem) return null;

  const isSelfResolve = targetItem.id === referenceItem.id;
  const isClaimingFound = targetItem.type === ItemType.FOUND && !isSelfResolve;
  const hasQuiz = targetItem.quizQuestion && targetItem.quizOptions && targetItem.quizOptions.length > 0;
  const isLocked = failedAttempts >= 2;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setClaimantImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isClaimingFound) {
      if (isLocked) {
         return; // Hard Lockout
      }
      
      // Zero-Knowledge Verification Logic
      if (hasQuiz) {
        if (selectedQuizOption !== targetItem.quizCorrectAnswer) {
          setQuizError(true);
          onQuizFail(targetItem.id);
          return;
        }
      }
      onConfirmClaimRequest(contact, name, claimantImage, true);
    } else {
      // Standard Resolution
      onConfirmResolve({
        resolvedBy: name,
        contactInfo: contact,
        notes: notes,
        resolutionDate: new Date().toISOString(),
        exchangeMethod: 'P2P_PIN' // Default for self-resolve
      }, alsoResolveRef);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">
            {isClaimingFound ? 'Secure Claim Request' : 'Resolve Report'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Identity Info */}
          <div className="grid grid-cols-1 gap-4">
             <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Your Name / ID</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded border-slate-300 p-2 text-sm" placeholder="e.g. Jane Doe" />
             </div>
             <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">Verified Email</label>
                <input type="text" required value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1 block w-full rounded border-slate-300 p-2 text-sm" placeholder="student@srmap.edu" />
             </div>
          </div>

          {isClaimingFound ? (
             <>
             <div className="border-t border-slate-100 pt-4">
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center">
                   <span className="bg-purple-100 text-purple-700 p-1 rounded mr-2"><SparklesIcon className="w-4 h-4"/></span>
                   Dynamic Verification Quiz
                </h4>
                
                {isLocked ? (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                    <AlertCircleIcon className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <h4 className="font-bold text-red-900">Account Locked</h4>
                    <p className="text-sm text-red-800 mt-1">
                      You failed the verification quiz twice. This item has been flagged. Please visit the Campus Security Office to appeal.
                    </p>
                  </div>
                ) : hasQuiz ? (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <p className="text-sm font-medium text-purple-900 mb-3">{targetItem.quizQuestion}</p>
                    <div className="space-y-2">
                       {targetItem.quizOptions?.map((option, idx) => (
                         <label key={idx} className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${selectedQuizOption === option ? 'bg-purple-200 border-purple-300' : 'bg-white border-purple-100 hover:bg-white'}`}>
                           <input 
                             type="radio" 
                             name="quiz" 
                             value={option} 
                             checked={selectedQuizOption === option}
                             onChange={() => { setSelectedQuizOption(option); setQuizError(false); }}
                             className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                           />
                           <span className="ml-2 text-sm text-slate-700">{option}</span>
                         </label>
                       ))}
                    </div>
                    {quizError && (
                      <p className="text-xs text-red-600 font-bold mt-2 flex items-center">
                        <AlertCircleIcon className="w-3 h-3 mr-1"/> Incorrect. Attempts remaining: {2 - failedAttempts}.
                      </p>
                    )}
                  </div>
                ) : (
                   <div className="bg-amber-50 p-4 rounded text-sm text-amber-800">
                     No quiz set. Please verify ownership in the chat.
                   </div>
                )}
             </div>
             
             {!isLocked && (
               <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Upload Proof (Optional)</label>
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center border overflow-hidden">
                       {claimantImage ? <img src={claimantImage} className="h-full w-full object-cover" /> : <span className="text-xs">IMG</span>}
                    </div>
                    <input type="file" className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" accept="image/*" onChange={handleImageUpload} />
                  </div>
               </div>
             )}
             </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700">Resolution Notes</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full rounded border-slate-300 p-2 text-sm" placeholder="e.g. Returned at library." />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50">Cancel</button>
            <button 
              type="submit" 
              disabled={isLocked && isClaimingFound}
              className={`px-4 py-2 text-sm font-bold text-white border border-transparent rounded shadow-sm ${isLocked && isClaimingFound ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700'}`}
            >
              {isClaimingFound ? 'Verify & Claim' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SmartMatch: React.FC<SmartMatchProps> = ({ item, allItems, onBack, onResolve, onSubmitClaim, campusHubs, classSchedule, failedAttempts, onQuizFail }) => {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [claimTarget, setClaimTarget] = useState<Item | null>(null);

  useEffect(() => {
    if (item.status === 'RESOLVED') { setIsLoading(false); return; }
    const fetchMatches = async () => {
      setIsLoading(true);
      const results = await findSmartMatches(item, allItems);
      setMatches(results.sort((a, b) => b.confidence - a.confidence));
      setIsLoading(false);
    };
    fetchMatches();
  }, [item.id, item.status]);

  const handleClaimClick = (target: Item) => {
    setClaimTarget(target);
    setIsModalOpen(true);
  };

  const handleConfirmResolve = (details: ResolutionDetails, alsoResolveReference: boolean) => {
    if (claimTarget) {
      onResolve(claimTarget.id, details);
      if (alsoResolveReference && claimTarget.id !== item.id) {
        onResolve(item.id, { ...details, notes: `Auto-resolved via match: ${claimTarget.title}` });
      }
      setIsModalOpen(false);
      setClaimTarget(null);
    }
  };

  const handleConfirmClaimRequest = (contact: string, name: string, image?: string, quizPassed?: boolean) => {
    if (claimTarget) {
      onSubmitClaim({
        itemId: claimTarget.id,
        itemTitle: claimTarget.title,
        claimantName: name,
        claimantContact: contact,
        claimantImage: image,
        quizPassed: quizPassed,
        status: 'PENDING'
      });
      setIsModalOpen(false);
      setClaimTarget(null);
    }
  };

  // Timetable Intelligence Logic
  const getLikelyOwnerContext = (target: Item) => {
    const timeLost = target.timeLost || "12:00"; // Fallback to generic time if not specified
    const location = target.location.toLowerCase();
    
    // Simple mock logic for timetable matching
    const matchingClass = classSchedule.find(session => {
       const sessionStart = parseInt(session.startTime.split(':')[0]);
       const itemTime = parseInt(timeLost.split(':')[0]);
       return location.includes(session.room.toLowerCase()) || Math.abs(itemTime - sessionStart) <= 1;
    });

    if (matchingClass) {
      return (
        <div className="mt-3 p-2 bg-indigo-50 text-indigo-900 text-xs rounded border border-indigo-100 flex items-center">
           <span className="mr-2 text-indigo-500">🎓</span>
           <span><strong>Intelligence Engine:</strong> Likely belongs to a student from <strong>{matchingClass.subject}</strong> ({matchingClass.room}, {matchingClass.startTime}).</span>
        </div>
      );
    }
    return null;
  };

  // Masking Function for "Blind Chat" simulation
  const maskEmail = (email: string) => email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

  const matchedItems = matches.map(m => {
    const fullItem = allItems.find(i => i.id === m.itemId);
    return fullItem ? { ...fullItem, matchData: m } : null;
  }).filter(Boolean) as (Item & { matchData: MatchResult })[];

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={onBack} className="mb-6 text-sm text-brand-600 font-medium flex items-center">← Back to Dashboard</button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reference Item Panel */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-200">
                   <h2 className="text-xl font-bold text-slate-900">Reference Item</h2>
                   <span className={`mt-2 inline-block px-2 py-1 rounded text-xs font-bold uppercase text-white ${item.type === ItemType.LOST ? 'bg-red-500' : 'bg-green-500'}`}>{item.type}</span>
                </div>
                {item.imageUrl && <img src={item.imageUrl} className="w-full h-64 object-cover" />}
                <div className="p-6">
                   <h3 className="text-lg font-semibold">{item.title}</h3>
                   <p className="text-sm text-slate-600 mt-2">{item.description}</p>
                   {item.ocrDetectedText && <div className="mt-3 p-2 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100"><strong>OCR Text:</strong> {item.ocrDetectedText}</div>}
                   {getLikelyOwnerContext(item)}
                   {item.status === 'OPEN' && (
                     <button onClick={() => handleClaimClick(item)} className="mt-4 w-full py-2 bg-slate-800 text-white rounded font-bold hover:bg-slate-900">{item.type === ItemType.FOUND ? 'Claim This' : 'Mark Found'}</button>
                   )}
                </div>
             </div>
          </div>

          {/* Matches Panel */}
          <div className="lg:col-span-2 space-y-4">
             <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center"><SparklesIcon className="w-6 h-6 text-brand-500 mr-2"/> Smart Matches</h2>
             {isLoading ? <div className="text-center p-12 text-slate-500">Scanning campus database...</div> : matchedItems.map(match => (
               <div key={match.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
                  <div className="w-full sm:w-48 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                     {match.imageUrl ? <img src={match.imageUrl} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-slate-400">No Img</div>}
                  </div>
                  <div className="flex-1">
                     <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-slate-900">{match.title}</h3>
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">{match.matchData.confidence}% Match</span>
                     </div>
                     <p className="text-sm text-slate-600 mt-1 line-clamp-2">{match.description}</p>
                     
                     {/* Timetable Intelligence for Match Candidates */}
                     {getLikelyOwnerContext(match)}

                     <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs text-slate-400 font-mono italic">
                           Blind Chat: {maskEmail(match.contactEmail)}
                        </span>
                        <button onClick={() => handleClaimClick(match)} className={`px-4 py-2 rounded text-sm font-bold text-white shadow-sm ${match.type === ItemType.FOUND ? 'bg-green-600 hover:bg-green-700' : 'bg-brand-600 hover:bg-brand-700'}`}>
                           {match.type === ItemType.FOUND ? 'Secure Claim' : 'Resolve'}
                        </button>
                     </div>
                  </div>
               </div>
             ))}
             {matchedItems.length === 0 && !isLoading && <div className="text-center p-12 text-slate-400">No high-confidence matches found.</div>}
          </div>
        </div>
      </div>
      <ClaimModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        targetItem={claimTarget} 
        referenceItem={item} 
        onConfirmResolve={handleConfirmResolve} 
        onConfirmClaimRequest={handleConfirmClaimRequest} 
        failedAttempts={claimTarget ? (failedAttempts || 0) : 0} // In real app, check specific ID
        onQuizFail={onQuizFail}
      />
    </>
  );
};

export default SmartMatch;