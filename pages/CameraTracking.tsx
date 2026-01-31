import React, { useEffect, useRef, useState } from 'react';
import { Item, ItemType } from '../types';
import { analyzeSurveillanceFrame } from '../services/geminiService';
import { AlertCircleIcon, SparklesIcon, MicrophoneIcon, EyeOffIcon, VideoIcon, VideoOffIcon } from '../components/Icons';

interface CameraTrackingProps {
  lostItems: Item[];
}

interface DetectedObject {
  object: string;
  description: string;
  confidence: number;
}

interface FeedStatus {
  id: string;
  name: string;
  type: 'LIVE' | 'STATIC';
  status: 'ACTIVE' | 'CONNECTING' | 'OFFLINE' | 'PAUSED';
  lastScan: string;
  detected: DetectedObject[];
  matchedLostItemId?: string;
  staticImage?: string; // For simulation
}

const STATIC_FEEDS = [
  {
    id: 'CAM-02',
    name: 'Library Reading Room',
    type: 'STATIC' as const,
    image: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=800' // Library image
  },
  {
    id: 'CAM-03',
    name: 'Student Center Cafe',
    type: 'STATIC' as const,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800' // Cafe image
  }
];

const CameraTracking: React.FC<CameraTrackingProps> = ({ lostItems }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [feeds, setFeeds] = useState<FeedStatus[]>([
    { id: 'CAM-01', name: 'Mobile Unit (Webcam)', type: 'LIVE', status: 'CONNECTING', lastScan: '-', detected: [] },
    { id: 'CAM-02', name: 'Library Reading Room', type: 'STATIC', status: 'ACTIVE', lastScan: '-', detected: [], staticImage: STATIC_FEEDS[0].image },
    { id: 'CAM-03', name: 'Student Center Cafe', type: 'STATIC', status: 'ACTIVE', lastScan: '-', detected: [], staticImage: STATIC_FEEDS[1].image },
  ]);

  // Advanced Features State
  const [privacyMode, setPrivacyMode] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [voiceFilter, setVoiceFilter] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(true);

  // Start Webcam
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setFeeds(prev => prev.map(f => f.type === 'LIVE' ? { ...f, status: 'ACTIVE' } : f));
        }
      } catch (err) {
        console.error("Camera access denied", err);
        setFeeds(prev => prev.map(f => f.type === 'LIVE' ? { ...f, status: 'OFFLINE' } : f));
      }
    };
    startCamera();

    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        // Toggle the track enabled state
        videoTrack.enabled = !isCameraActive;
        const nextState = !isCameraActive;
        setIsCameraActive(nextState);
        
        // Update feed status
        setFeeds(prev => prev.map(f => f.type === 'LIVE' ? { 
            ...f, 
            status: nextState ? 'ACTIVE' : 'PAUSED' 
        } : f));
      }
    }
  };

  const captureFrame = (video: HTMLVideoElement): string | null => {
    if (!canvasRef.current) return null;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return null;
    canvasRef.current.width = video.videoWidth;
    canvasRef.current.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    return canvasRef.current.toDataURL('image/jpeg').split(',')[1];
  };

  const convertImageUrlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    });
  };

  const handleScan = async () => {
    setIsScanning(true);
    
    // Process each feed
    const updatedFeeds = await Promise.all(feeds.map(async (feed) => {
      if (feed.status !== 'ACTIVE') return feed;

      let base64Image: string | null = null;

      if (feed.type === 'LIVE' && videoRef.current) {
        if (!isCameraActive) return feed; // Skip scanning if camera is paused
        base64Image = captureFrame(videoRef.current);
      } else if (feed.type === 'STATIC' && feed.staticImage) {
        base64Image = await convertImageUrlToBase64(feed.staticImage);
      }

      if (!base64Image) return feed;

      // Call AI
      const objects = await analyzeSurveillanceFrame(base64Image);
      
      // Cross Reference with Lost Items
      let matchedId: string | undefined = undefined;
      
      // Heuristic matching
      for (const obj of objects) {
        const match = lostItems.find(item => 
            item.status === 'OPEN' && 
            (
                item.title.toLowerCase().includes(obj.object.toLowerCase()) || 
                item.aiTags.some(tag => obj.description.toLowerCase().includes(tag.toLowerCase()))
            )
        );
        if (match) {
            matchedId = match.id;
            break; 
        }
      }

      return {
        ...feed,
        lastScan: new Date().toLocaleTimeString(),
        detected: objects,
        matchedLostItemId: matchedId
      };
    }));

    setFeeds(updatedFeeds);
    setIsScanning(false);
  };

  // Simulated Voice Command
  const startVoiceCommand = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Web Speech API not supported in this browser.");
      return;
    }

    setVoiceActive(true);
    setVoiceCommand("Listening...");
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceCommand(`"${transcript}"`);
      
      // Simple Keyword Logic for demo
      const keywords = transcript.toLowerCase().split(' ');
      const targetObj = keywords.find((w: string) => ['backpack', 'laptop', 'bottle', 'phone', 'keys', 'bag'].includes(w));
      
      if (targetObj) {
         setVoiceFilter(targetObj);
         setTimeout(() => setVoiceActive(false), 2000);
      } else if (transcript.toLowerCase().includes('clear')) {
         setVoiceFilter('');
         setVoiceActive(false);
      } else {
         setVoiceFilter(transcript); // Try generic
         setTimeout(() => setVoiceActive(false), 2000);
      }
    };

    recognition.onerror = () => {
      setVoiceCommand("Error. Try again.");
      setVoiceActive(false);
    };

    recognition.start();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-700 pb-6 gap-4">
          <div>
             <h1 className="text-3xl font-bold flex items-center">
               <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></span>
               Campus Eye Surveillance
             </h1>
             <p className="text-slate-400 mt-1 font-mono text-sm tracking-widest">MULTI-CAMERA AI TRACKING SYSTEM</p>
          </div>
          
          <div className="flex gap-3 flex-wrap justify-end">
             <button
                onClick={() => setPrivacyMode(!privacyMode)}
                className={`px-4 py-3 rounded font-bold flex items-center gap-2 transition-all border ${privacyMode ? 'bg-indigo-900 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}
             >
                <EyeOffIcon className="w-5 h-5" />
                <span>{privacyMode ? 'PRIVACY SHIELD ON' : 'PRIVACY OFF'}</span>
             </button>

             <button 
                onClick={toggleCamera}
                className={`px-4 py-3 rounded font-bold flex items-center gap-2 transition-all border ${isCameraActive ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700' : 'bg-red-900 border-red-600 text-red-200'}`}
             >
                {isCameraActive ? <VideoIcon className="w-5 h-5" /> : <VideoOffIcon className="w-5 h-5" />}
                <span>{isCameraActive ? 'MOBILE CAM ON' : 'MOBILE CAM OFF'}</span>
             </button>

             <button 
                onClick={startVoiceCommand}
                className={`px-4 py-3 rounded font-bold flex items-center gap-2 transition-all border ${voiceActive ? 'bg-red-600 border-red-500 text-white animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
             >
                <MicrophoneIcon className="w-5 h-5" />
                <span>{voiceActive ? voiceCommand : 'VOICE SEARCH'}</span>
             </button>

             <button 
               onClick={handleScan}
               disabled={isScanning || !isCameraActive}
               className={`px-6 py-3 rounded font-bold shadow-lg flex items-center gap-2 transition-all ${isScanning ? 'bg-slate-700 cursor-wait' : (!isCameraActive ? 'bg-slate-700 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-500')}`}
             >
               {isScanning ? <span className="animate-spin">↻</span> : <SparklesIcon className="w-5 h-5" />}
               {isScanning ? 'ANALYZING...' : 'SCAN'}
             </button>
          </div>
        </header>

        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Voice Command Filter Indicator */}
        {voiceFilter && (
           <div className="mb-4 bg-blue-900/50 border border-blue-500/50 p-2 rounded flex justify-between items-center max-w-md">
              <span className="text-blue-200 text-sm font-mono">Filtering for: <strong>"{voiceFilter}"</strong></span>
              <button onClick={() => setVoiceFilter('')} className="text-blue-300 hover:text-white px-2">CLEAR</button>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {feeds.map((feed) => (
            <div key={feed.id} className={`relative bg-black rounded-lg overflow-hidden border-2 shadow-2xl transition-all ${feed.matchedLostItemId ? 'border-red-500 ring-4 ring-red-500/20' : 'border-slate-800'}`}>
               
               {/* Feed Header Overlay */}
               <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start z-10 pointer-events-none">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-300">{feed.id}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${feed.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : (feed.status === 'PAUSED' ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300')}`}>
                        {feed.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mt-1 text-white">{feed.name}</h3>
                  </div>
                  {feed.matchedLostItemId && (
                      <div className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold animate-pulse flex items-center">
                        <AlertCircleIcon className="w-4 h-4 mr-1"/>
                        MATCH DETECTED
                      </div>
                  )}
               </div>

               {/* Video Content */}
               <div className="aspect-video relative bg-slate-800 flex items-center justify-center overflow-hidden">
                  {/* Privacy Blur Layer */}
                  {privacyMode && isCameraActive && (
                     <div className="absolute inset-0 z-0 backdrop-blur-md bg-white/5 pointer-events-none border-4 border-indigo-500/30">
                        <div className="absolute bottom-2 right-2 text-indigo-300 font-mono text-xs bg-black/50 px-2 rounded">
                           IDENTITY SHIELD ACTIVE
                        </div>
                     </div>
                  )}

                  {feed.type === 'LIVE' ? (
                    <>
                     <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`} />
                     {!isCameraActive && (
                        <div className="flex flex-col items-center text-slate-500">
                           <VideoOffIcon className="w-12 h-12 mb-2 opacity-50" />
                           <span className="font-mono text-sm tracking-widest">FEED PAUSED</span>
                        </div>
                     )}
                    </>
                  ) : (
                     <img src={feed.staticImage} alt={feed.name} className="w-full h-full object-cover opacity-80" />
                  )}
               </div>

               {/* Analysis Overlay */}
               <div className="bg-slate-900/95 p-4 border-t border-slate-700 h-48 overflow-y-auto">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-slate-500">LAST SCAN: {feed.lastScan}</span>
                    <span className="text-xs font-mono text-slate-500">{feed.detected.length} OBJECTS</span>
                 </div>
                 
                 {feed.detected.length === 0 ? (
                    <div className="text-center mt-8 text-slate-600 text-sm italic">System standby. Waiting for scan...</div>
                 ) : (
                    <div className="space-y-2">
                       {feed.detected.map((det, idx) => {
                          // Check if this specific object matches a lost item to highlight it
                          const isMatch = lostItems.some(li => li.id === feed.matchedLostItemId && (li.title.includes(det.object) || det.description.includes(li.title)));
                          const isVoiceMatch = voiceFilter && (det.object.toLowerCase().includes(voiceFilter) || det.description.toLowerCase().includes(voiceFilter));

                          return (
                            <div key={idx} className={`flex justify-between items-center p-2 rounded text-sm transition-colors ${isMatch ? 'bg-red-900/30 border border-red-800' : isVoiceMatch ? 'bg-blue-900/40 border border-blue-500' : 'bg-slate-800'}`}>
                              <div>
                                <span className={`font-bold ${isMatch ? 'text-red-300' : isVoiceMatch ? 'text-blue-300' : 'text-slate-200'}`}>{det.object}</span>
                                <p className="text-xs text-slate-400">{det.description}</p>
                              </div>
                              <div className="text-right">
                                 <span className="block text-xs font-mono text-blue-400">{(det.confidence * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          );
                       })}
                    </div>
                 )}
               </div>

               {/* Match Action */}
               {feed.matchedLostItemId && (
                  <div className="bg-red-900/90 p-3 flex justify-between items-center animate-in slide-in-from-bottom">
                     <span className="text-sm text-red-100 font-bold">Potential match for Lost Item #{feed.matchedLostItemId}</span>
                     <button className="bg-white text-red-900 px-3 py-1 rounded text-xs font-bold hover:bg-slate-200">
                        DISPATCH SECURITY
                     </button>
                  </div>
               )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CameraTracking;