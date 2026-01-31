import React, { useState, useRef, useEffect } from 'react';
import { ItemType, ItemCategory, Item, CampusHub } from '../types';
import { CameraIcon, SparklesIcon, XIcon, MapPinIcon, AlertCircleIcon } from '../components/Icons';
import { analyzeItemImage } from '../services/geminiService';

interface ReportItemProps {
  type: ItemType;
  onSubmit: (item: Omit<Item, 'id' | 'status'>) => void;
  onCancel: () => void;
  campusHubs: CampusHub[];
}

const ReportItem: React.FC<ReportItemProps> = ({ type, onSubmit, onCancel, campusHubs }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ItemCategory>(ItemCategory.OTHER);
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeLost, setTimeLost] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [reporterPreview, setReporterPreview] = useState<string | null>(null);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // OCR State
  const [ocrText, setOcrText] = useState('');

  // Zero-Knowledge Quiz State
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizCorrect, setQuizCorrect] = useState('');
  const [quizDecoy1, setQuizDecoy1] = useState('');
  const [quizDecoy2, setQuizDecoy2] = useState('');

  // New Feature States
  const [isUrgent, setIsUrgent] = useState(false);
  const [isMovedToHub, setIsMovedToHub] = useState(false);
  const [dropOffHubId, setDropOffHubId] = useState('');
  const [isHighValue, setIsHighValue] = useState(false);

  // Auto-detect high value
  useEffect(() => {
    const highValueCategories = [ItemCategory.ELECTRONICS, ItemCategory.ID_CARDS, ItemCategory.KEYS];
    const isHV = highValueCategories.includes(category);
    setIsHighValue(isHV);
    
    if (type === ItemType.FOUND && isHV && !isMovedToHub) {
       setIsMovedToHub(true); 
    }
  }, [category, type]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      
      try {
        setIsAnalyzing(true);
        const base64Content = base64String.split(',')[1];
        const analysis = await analyzeItemImage(base64Content, file.type);
        
        setTitle(analysis.title);
        setDescription(analysis.description);
        setCondition(analysis.condition);
        const matchedCategory = Object.values(ItemCategory).find(c => c === analysis.category) || ItemCategory.OTHER;
        setCategory(matchedCategory);
        setAiTags(analysis.tags);
        setOcrText(analysis.ocrText);

      } catch (error) {
        console.error("Analysis failed", error);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReporterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setReporterPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = newTag.trim();
      if (trimmed && !aiTags.includes(trimmed)) {
        setAiTags([...aiTags, trimmed]);
        setNewTag('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setAiTags(aiTags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Domain Lock Check (Identity Shield)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@srmap\.edu$/;
    if (!emailRegex.test(contactEmail)) {
        alert("Security Alert: You must use a valid @srmap.edu email address to report items.");
        return;
    }

    const quizOptions = type === ItemType.FOUND ? [quizCorrect, quizDecoy1, quizDecoy2].sort(() => Math.random() - 0.5) : undefined;

    onSubmit({
      type,
      title,
      description,
      category,
      condition,
      location,
      date,
      timeLost: timeLost || undefined,
      contactName,
      contactEmail,
      imageUrl: preview || undefined,
      reporterImage: reporterPreview || undefined,
      aiTags,
      ocrDetectedText: ocrText,
      
      // Zero-Knowledge Quiz
      quizQuestion: type === ItemType.FOUND ? quizQuestion : undefined,
      quizOptions: type === ItemType.FOUND ? quizOptions : undefined,
      quizCorrectAnswer: type === ItemType.FOUND ? quizCorrect : undefined,

      isUrgent: type === ItemType.LOST ? isUrgent : undefined,
      isMovedToHub: type === ItemType.FOUND ? isMovedToHub : undefined,
      dropOffHubId: type === ItemType.FOUND && isMovedToHub ? dropOffHubId : undefined,
      isHighValue: isHighValue
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8">
      <div className="mb-6 pb-4 border-b border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800">
          Report {type === ItemType.LOST ? 'Lost' : 'Found'} Item
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Upload a photo to let our AI auto-fill the details and scan for ID info.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Area */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Item Photo</label>
          <div 
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              preview ? 'border-brand-500 bg-slate-50' : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="mx-auto h-48 object-contain rounded-md" />
                <button
                  type="button"
                  onClick={() => { setPreview(null); if(fileInputRef.current) fileInputRef.current.value = ''; setOcrText(''); }}
                  className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <div 
                className="cursor-pointer flex flex-col items-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <CameraIcon className="w-12 h-12 text-slate-400 mb-2" />
                <span className="text-sm text-slate-500">Click to upload item image</span>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>
          {isAnalyzing && (
            <div className="flex items-center text-brand-600 text-sm animate-pulse">
              <SparklesIcon className="w-4 h-4 mr-2" />
              AI is analyzing identity data...
            </div>
          )}
        </div>

        {/* Feature: Identity Shield OCR Alert */}
        {ocrText && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-md flex items-start">
             <div className="mr-3 text-blue-500 mt-1">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .667.455 1 1 1h2c.545 0 1-.333 1-1" /></svg>
             </div>
             <div>
               <h4 className="text-sm font-bold text-blue-900">Identity Shield Active</h4>
               <p className="text-sm text-blue-800">
                 We detected text on this item: <strong>"{ocrText}"</strong>. 
                 If this matches a student ID or name, the system will attempt to notify them privately.
               </p>
             </div>
          </div>
        )}

        {/* Generated Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
              placeholder="e.g. Blue Hydro Flask"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
              placeholder="Detailed description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ItemCategory)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
            >
              {Object.values(ItemCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Condition</label>
            <input
              type="text"
              value={condition}
              onChange={e => setCondition(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"
              placeholder="e.g. Scratched, New, Good"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700">Date {type === ItemType.LOST ? 'Lost' : 'Found'}</label>
             <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"/>
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700">Time (Approx)</label>
             <input type="time" value={timeLost} onChange={e => setTimeLost(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"/>
          </div>
          <div className="col-span-1">
             <label className="block text-sm font-medium text-slate-700">Location</label>
             <input type="text" required value={location} onChange={e => setLocation(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border" placeholder="e.g. Science Library"/>
          </div>

          {/* Feature: Zero-Knowledge Verification Quiz Creator (Only for Found) */}
          {type === ItemType.FOUND && (
            <div className="col-span-2 bg-purple-50 p-4 rounded-lg border border-purple-100 mt-2">
               <div className="flex items-center mb-3">
                 <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                 <h3 className="text-sm font-bold text-purple-900">Anti-Fraud "Challenge-Response" Setup</h3>
               </div>
               <p className="text-xs text-purple-800 mb-4">
                 Define a <strong>Blind Trait</strong> (e.g., hidden scratch, battery level, lock screen image). The system will generate a randomized quiz for claimants.
               </p>
               
               <div className="space-y-3">
                 <div>
                   <label className="block text-xs font-semibold text-purple-900">Blind Trait Question</label>
                   <input type="text" required value={quizQuestion} onChange={e => setQuizQuestion(e.target.value)} className="mt-1 w-full text-sm p-2 border border-purple-200 rounded" placeholder="e.g. What specific sticker is on the laptop lid?" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-green-700">True Trait (Answer)</label>
                      <input type="text" required value={quizCorrect} onChange={e => setQuizCorrect(e.target.value)} className="mt-1 w-full text-sm p-2 border border-green-200 rounded bg-green-50" placeholder="e.g. NASA Sticker" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-red-700">Decoy 1</label>
                      <input type="text" required value={quizDecoy1} onChange={e => setQuizDecoy1(e.target.value)} className="mt-1 w-full text-sm p-2 border border-red-200 rounded bg-red-50" placeholder="e.g. Apple Logo" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-red-700">Decoy 2</label>
                      <input type="text" required value={quizDecoy2} onChange={e => setQuizDecoy2(e.target.value)} className="mt-1 w-full text-sm p-2 border border-red-200 rounded bg-red-50" placeholder="e.g. Plain Silver" />
                    </div>
                 </div>
               </div>
            </div>
          )}

          {/* Feature: Safe Drop-off Logic (Only for Found) */}
          {type === ItemType.FOUND && (
             <div className={`col-span-2 p-4 rounded-md border ${isHighValue ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center mb-2">
                   <h3 className="text-sm font-semibold text-slate-900">Custody Status</h3>
                   {isHighValue && (
                     <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-200 text-orange-800 uppercase tracking-wide flex items-center">
                        <AlertCircleIcon className="w-3 h-3 mr-1" />
                        Escrow Protocol
                     </span>
                   )}
                </div>
                
                {isHighValue && (
                  <p className="text-xs text-orange-800 mb-3 font-medium">
                    Security Alert: High-value items require Chain of Custody. Peer-to-Peer PIN exchange is DISABLED. You must drop this at a Security Hub.
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input 
                      type="radio"
                      id="status-left"
                      name="itemStatus"
                      checked={!isMovedToHub}
                      onChange={() => setIsMovedToHub(false)}
                      disabled={isHighValue}
                      className="focus:ring-brand-500 h-4 w-4 text-brand-600 border-gray-300 disabled:opacity-50"
                    />
                    <label htmlFor="status-left" className={`ml-2 block text-sm ${isHighValue ? 'text-slate-400' : 'text-slate-700'}`}>
                      I have it / Left it there.
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="radio"
                      id="status-moved"
                      name="itemStatus"
                      checked={isMovedToHub}
                      onChange={() => setIsMovedToHub(true)}
                      className="focus:ring-brand-500 h-4 w-4 text-brand-600 border-gray-300"
                    />
                    <label htmlFor="status-moved" className="ml-2 block text-sm text-slate-700">
                      I moved it to a Security Hub (Recommended).
                    </label>
                  </div>

                  {isMovedToHub && (
                    <div className="ml-6 mt-2">
                       <select required={isMovedToHub} value={dropOffHubId} onChange={e => setDropOffHubId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md">
                         <option value="">-- Select Security Hub --</option>
                         {campusHubs.map(hub => (
                           <option key={hub.id} value={hub.id}>{hub.name}</option>
                         ))}
                       </select>
                    </div>
                  )}
                </div>
             </div>
          )}
          
          {/* Tag Editor */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-300 rounded-md min-h-[46px]">
              {aiTags.map(tag => (
                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-brand-100 text-brand-800">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-brand-400 hover:text-brand-600 hover:bg-brand-200"><XIcon className="h-3 w-3" /></button>
                </span>
              ))}
              <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={handleAddTag} placeholder="Add tag..." className="flex-1 min-w-[120px] bg-transparent border-none focus:ring-0 text-sm p-1"/>
            </div>
          </div>

           <div className="col-span-2 pt-4 border-t border-slate-100">
             <h3 className="text-sm font-semibold text-slate-900 mb-4">Contact Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Name</label>
                  <input type="text" required value={contactName} onChange={e => setContactName(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Campus Email (@srmap.edu)</label>
                  <input type="email" required value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2 border" placeholder="student@srmap.edu"/>
                </div>
                <div className="col-span-2">
                   <label className="block text-sm font-medium text-slate-700">Reporter Photo</label>
                   <div className="mt-2 flex items-center space-x-4">
                     <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                        {reporterPreview ? <img src={reporterPreview} alt="Reporter" className="h-full w-full object-cover" /> : <svg className="h-8 w-8 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                     </div>
                     <label className="cursor-pointer bg-white py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                       Upload Your Photo
                       <input type="file" className="hidden" accept="image/*" onChange={handleReporterFileChange} />
                     </label>
                   </div>
                </div>
             </div>
           </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <button type="button" onClick={onCancel} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700">Submit Report</button>
        </div>
      </form>
    </div>
  );
};

export default ReportItem;