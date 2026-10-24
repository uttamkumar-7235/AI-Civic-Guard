import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Upload, 
  Sparkles, 
  Camera, 
  Check, 
  AlertTriangle, 
  Building2, 
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { IssueCategory, IssueSeverity, LocationData } from '../types';
import { CATEGORY_CONFIG, DEPARTMENTS } from '../lib/constants';
import { useAuth } from '../context/AuthContext';
import { useIssues } from '../context/IssueContext';

interface ReportIssueModalProps {
  onClose: () => void;
  initialCoords?: { lat: number; lng: number } | null;
}

const SAMPLE_PHOTO_PRESETS = [
  { label: 'Deep Pothole', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80' },
  { label: 'Water Leak', url: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800&auto=format&fit=crop&q=80' },
  { label: 'Broken Light', url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80' },
  { label: 'Downed Wire', url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800&auto=format&fit=crop&q=80' },
  { label: 'Trash Overflow', url: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80' },
];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ onClose, initialCoords }) => {
  const { currentUser } = useAuth();
  const { createIssue } = useIssues();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('roads');
  const [imageUrl, setImageUrl] = useState('');
  const [address, setAddress] = useState('742 5th Avenue, Metro Center');
  const [landmark, setLandmark] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    initialCoords || { lat: 37.7749, lng: -122.4194 }
  );

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<IssueSeverity>('medium');
  const [selectedDepartment, setSelectedDepartment] = useState('Public Works');
  const [priorityScore, setPriorityScore] = useState<number>(65);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  // Quick GPS Grab
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsLoading(false);
        setGpsSuccess(true);
        setTimeout(() => setGpsSuccess(false), 3000);
      },
      err => {
        console.warn('GPS error, using default coordinates:', err);
        setGpsLoading(false);
        setCoords({ lat: 37.7749, lng: -122.4194 });
      },
      { timeout: 8000 }
    );
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger Gemini AI Analysis
  const handleRunAiAnalysis = async () => {
    if (!title && !description) {
      alert('Please enter a brief title or description first.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          categoryHint: category,
          location: { address, coords },
          imageBase64: imageUrl.startsWith('data:') ? imageUrl : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiResult(data);
        if (data.severity) setSelectedSeverity(data.severity);
        if (data.department) setSelectedDepartment(data.department);
        if (data.priorityScore) setPriorityScore(data.priorityScore);
        if (data.detectedCategory && CATEGORY_CONFIG[data.detectedCategory as IssueCategory]) {
          setCategory(data.detectedCategory as IssueCategory);
        }
      }
    } catch (err) {
      console.error('Failed to run AI analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit Issue
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please provide an issue title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const locationData: LocationData = {
        lat: coords.lat,
        lng: coords.lng,
        address: address.trim() || 'Central Metro',
        landmark: landmark.trim() || undefined,
      };

      await createIssue({
        title: title.trim(),
        description: description.trim() || 'Community issue reported by citizen.',
        category,
        status: 'reported',
        severity: selectedSeverity,
        priority_score: priorityScore,
        location: locationData,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
        ai_analysis: aiResult || {
          severity: selectedSeverity,
          priorityScore,
          detectedCategory: category,
          department: selectedDepartment,
          recommendedAction: 'Dispatch municipal assessment crew.',
          estimatedDays: 4,
          hazards: ['General municipal maintenance requirement'],
          confidence: 0.90,
          summary: `Reported issue under ${category}.`,
        },
        reported_by: currentUser.id,
        reporter_name: currentUser.full_name,
        department: selectedDepartment,
      });

      onClose();
    } catch (err) {
      console.error('Failed to submit issue:', err);
      alert('Error submitting issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Report a Civic Issue
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI will assess severity, priority, and route directly to city departments.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Issue Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Deep pothole damaging cars on 4th & Market"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm glass-input text-slate-900 dark:text-white"
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(CATEGORY_CONFIG) as IssueCategory[]).map(catKey => {
                const conf = CATEGORY_CONFIG[catKey];
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-slate-100/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200/50 dark:border-white/10 hover:border-blue-400'
                    }`}
                  >
                    <span className="truncate">{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Incident Description & Civic Impact
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what happened, any visible hazards, frequency, or immediate dangers..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm glass-input text-slate-900 dark:text-white"
            />
          </div>

          {/* Photographic Evidence */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Photo Evidence
              </label>
              <span className="text-[11px] text-slate-400">Upload or select a sample</span>
            </div>

            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden h-40 border border-slate-200 dark:border-white/10">
                <img src={imageUrl} alt="Uploaded evidence" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-900/30">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Click to upload photo or take picture
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>

                {/* Preset sample buttons */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Presets:</span>
                  {SAMPLE_PHOTO_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(p.url)}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-slate-700"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location & GPS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Street Address / Location *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 742 5th Avenue"
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={e => setLandmark(e.target.value)}
                placeholder="e.g. Near St. Mary Church or Metro Station"
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* GPS Quick Action */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-500" />
              <div className="text-xs text-slate-700 dark:text-slate-300">
                GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGetGPS}
              disabled={gpsLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-all flex items-center gap-1.5"
            >
              {gpsLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Locating...</span>
                </>
              ) : gpsSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>GPS Locked!</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Get My GPS</span>
                </>
              )}
            </button>
          </div>

          {/* AI Diagnostic Engine Trigger Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-600/10 via-blue-600/10 to-indigo-600/10 border border-cyan-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Severity Assessment & Auto-Routing</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Let Gemini analyze your photo and description to calculate priority and target department.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={isAnalyzing}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-500/25 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 justify-center"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Diagnostics</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Results Card if available */}
            {aiResult && (
              <div className="pt-3 border-t border-cyan-500/20 space-y-2 animate-in fade-in">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Assessed Priority:
                  </span>
                  <span className="text-sm font-black text-cyan-600 dark:text-cyan-400">
                    {aiResult.priorityScore}/100
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-300 font-bold capitalize">
                    {aiResult.severity} Severity
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold">
                    Dept: {aiResult.department}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {aiResult.summary}
                </p>

                {aiResult.hazards && aiResult.hazards.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {aiResult.hazards.map((h: string, idx: number) => (
                      <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        ⚠️ {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Department and Severity Confirmation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Department
              </label>
              <select
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-900 dark:text-white"
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Severity Level
              </label>
              <select
                value={selectedSeverity}
                onChange={e => setSelectedSeverity(e.target.value as IssueSeverity)}
                className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-900 dark:text-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Severity</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Emergency</option>
              </select>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to City...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Issue Report</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
