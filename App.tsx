/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  FileText, 
  Clock, 
  Stethoscope, 
  ArrowRight, 
  RefreshCcw,
  AlertCircle,
  Activity,
  Heart,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { analyzePrescription, analyzeBloodReport } from './services/geminiService';
import { ScheduleGuide } from './components/ScheduleGuide';
import { cn } from './lib/utils';

type Section = 'prescription' | 'schedule' | 'blood-report' | 'general';

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('prescription');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setResult(null);

    try {
      let analysis;
      if (activeSection === 'prescription') {
        analysis = await analyzePrescription(selectedImage);
      } else if (activeSection === 'blood-report') {
        analysis = await analyzeBloodReport(selectedImage);
      }
      setResult(analysis || "বিশ্লেষণ করতে সমস্যা হয়েছে।");
    } catch (err) {
      setResult("দুঃখিত, কোনো একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">আপনার স্বাস্থ্য সহকারী</h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            অনলাইন
          </span>
          <span className="hidden md:block">১০ মে ২০২৬</span>
        </div>
      </header>

      {/* Main Bento Layout */}
      <main className="flex-1 p-4 md:p-6 max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-6 gap-4">
        
        {/* Navigation - Top Bento Area */}
        <div className="lg:col-span-12 lg:row-span-1 flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
          {[
            { id: 'prescription', label: 'প্রেসক্রিপশন', icon: FileText },
            { id: 'schedule', label: 'ওষুধের সময়', icon: Clock },
            { id: 'blood-report', label: 'রিপোর্ট', icon: Activity },
            { id: 'general', label: 'স্বাস্থ্য তথ্য', icon: Heart },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSection(tab.id as Section);
                reset();
              }}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300",
                activeSection === tab.id 
                  ? "bg-emerald-600 text-white shadow-xl shadow-emerald-200 scale-105" 
                  : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Primary Analysis Card (Bento Area 1 - Large) */}
        <div className="lg:col-span-8 lg:row-span-4 bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col min-h-[450px]">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                {activeSection === 'prescription' ? <FileText className="w-7 h-7" /> : <Activity className="w-7 h-7" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-none">
                  {activeSection === 'prescription' ? "প্রেসক্রিপশন বিশ্লেষণ" : "রিপোর্ট বিশ্লেষণ"}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">AI প্রযুক্তির সাহায্যে স্বাস্থ্য তথ্য জানুন</p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="h-full"
              >
                {(activeSection === 'prescription' || activeSection === 'blood-report') ? (
                  <div className="space-y-6">
                    {!selectedImage ? (
                      <label className="group relative block w-full aspect-video rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} ref={fileInputRef} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center gap-4">
                          <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-slate-300 group-hover:text-emerald-500 border border-slate-100">
                            <Camera className="w-10 h-10" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xl font-bold text-slate-700">ছবি আপলোড করুন</p>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto">ক্যামেরা দিয়ে পরিষ্কার ফটো তুলুন অথবা গ্যালারি থেকে রিপোর্টটি সিলেক্ট করুন</p>
                          </div>
                        </div>
                      </label>
                    ) : (
                      <div className="space-y-6">
                        <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-black group max-h-[400px]">
                          <img src={selectedImage} alt="Analysis Target" className="w-full h-full object-contain opacity-90 transition-opacity group-hover:opacity-100" />
                          <button onClick={reset} className="absolute top-4 right-4 p-4 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition-colors shadow-lg">
                            <RefreshCcw className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {!result && (
                          <button 
                            onClick={handleAnalyze} 
                            disabled={isLoading}
                            className="w-full h-16 bg-emerald-600 text-white rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-3 hover:bg-emerald-700 shadow-xl shadow-emerald-100 disabled:opacity-50 transition-all transform active:scale-95"
                          >
                            {isLoading ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                            {isLoading ? "বিশ্লেষণ করা হচ্ছে..." : "বিশ্লেষণ শুরু করুন"}
                          </button>
                        )}

                        {result && (
                          <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative shadow-inner"
                          >
                            <div className="prose prose-slate max-w-none prose-emerald font-bangla leading-relaxed text-slate-700">
                              <ReactMarkdown>{result}</ReactMarkdown>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                ) : activeSection === 'schedule' ? (
                  <ScheduleGuide />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: "প্রচুর পানি পান করুন", desc: "শারীরিক স্বচ্ছতা বজায় রাখতে দিনে অন্তত ৮ গ্লাস পানি পান করুন।", icon: "💧" },
                      { title: "পুষ্টিকর খাবার", desc: "শাকসবজি ও ফলমূল প্রতিদিনের খাদ্যতালিকায় প্রাধান্য দিন।", icon: "🥗" },
                      { title: "পর্যাপ্ত ঘুম", desc: "সুস্থ মস্তিষ্কের জন্য দিনে ৮ ঘণ্টা ঘুম অপরিহার্য।", icon: "😴" },
                      { title: "শারীরিক ব্যায়াম", desc: "৩০ মিনিট হাঁটাহাঁটি হার্ট ও ফুসফুসকে সতেজ রাখে।", icon: "🧘" }
                    ].map((tip, i) => (
                      <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex gap-5 hover:bg-white hover:shadow-md transition-all cursor-default group">
                        <span className="text-4xl group-hover:scale-125 transition-transform">{tip.icon}</span>
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg">{tip.title}</h4>
                          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{tip.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Side Bento Card: Schedule Brief (Bento Area 2) */}
        <div className="lg:col-span-4 lg:row-span-3 bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Clock className="w-5 h-5" /></div>
            <h2 className="text-lg font-bold">ওষুধের সময় কোড</h2>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-1">
            {[
              { code: "১-০-১", morning: true, night: true },
              { code: "১-১-১", morning: true, noon: true, night: true },
              { code: "HS", label: "ঘুমানোর আগে" },
              { code: "SOS", label: "প্রয়োজন হলে" },
              { code: "০-১-০", noon: true },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-blue-50/50 transition-all group">
                <span className="font-black text-xl text-blue-700 tracking-tighter group-hover:scale-105 transition-transform">{s.code}</span>
                <div className="flex gap-2">
                  {s.label || (
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {s.morning && <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg text-[10px] font-bold">সকাল</span>}
                      {s.noon && <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-[10px] font-bold">দুপুর</span>}
                      {s.night && <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-[10px] font-bold">রাত</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 flex items-center justify-center">
            <p className="text-[10px] text-blue-700 text-center font-bold uppercase tracking-widest opacity-70">
              সহজ নির্দেশিকা
            </p>
          </div>
        </div>

        {/* Side Bento Card: Status Legend (Bento Area 3) */}
        <div className="lg:col-span-4 lg:row-span-3 bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
             <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><Activity className="w-5 h-5" /></div>
            <h2 className="text-lg font-bold">রিপোর্ট সংকেত</h2>
          </div>
          <div className="space-y-4">
             <div className="p-5 bg-rose-50/80 rounded-3xl border border-rose-100 border-l-8 border-l-rose-500 shadow-sm">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-black text-rose-700 tracking-widest uppercase">High / বেশি</span>
                 <AlertCircle className="w-4 h-4 text-rose-500" />
               </div>
               <p className="text-base font-bold text-rose-900">স্বাভাবিকের চেয়ে উপরে</p>
             </div>
             <div className="p-5 bg-sky-50/80 rounded-3xl border border-sky-100 border-l-8 border-l-sky-500 shadow-sm">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-black text-sky-700 tracking-widest uppercase">Low / কম</span>
                 <ArrowRight className="w-4 h-4 text-sky-500 rotate-90" />
               </div>
               <p className="text-base font-bold text-sky-900">স্বাভাবিকের চেয়ে নিচে</p>
             </div>
             <div className="p-5 bg-emerald-50/80 rounded-3xl border border-emerald-100 border-l-8 border-l-emerald-500 shadow-sm">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-black text-emerald-700 tracking-widest uppercase">Normal / সঠিক</span>
                 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
               </div>
               <p className="text-base font-bold text-emerald-900">স্বাভাবিক সীমার মধ্যে</p>
             </div>
          </div>
        </div>

        {/* Bottom Wide Bento: Motivation (Bento Area 4) */}
        <div className="lg:col-span-8 lg:row-span-2 bg-emerald-600 rounded-[2.5rem] p-8 md:p-10 text-white flex items-center justify-between shadow-2xl shadow-emerald-200 relative overflow-hidden group">
          <div className="relative z-10 max-w-lg">
            <h3 className="text-2xl md:text-3xl font-black mb-4 tracking-tight">সুস্থ থাকুন, সারাজীবন</h3>
            <p className="text-emerald-50 text-lg leading-relaxed font-medium italic opacity-95">
              "প্রতিদিন অন্তত ৩০ মিনিট হাঁটার চেষ্টা করুন এবং পর্যাপ্ত পানি পান করুন। আমাদের AI সহকারী সবসময় আপনার সেবায় আছে।"
            </p>
          </div>
          <div className="relative z-10 hidden md:block group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
            <div className="w-32 h-32 bg-white/20 backdrop-blur-2xl rounded-full flex items-center justify-center text-7xl shadow-2xl border border-white/20">
              🌿
            </div>
          </div>
          
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-emerald-500 rounded-full opacity-30 mix-blend-screen"></div>
          <div className="absolute left-1/4 top-0 w-48 h-48 bg-emerald-400 rounded-full opacity-20 blur-[100px]"></div>
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full blur-3xl"></div>
        </div>

      </main>

      {/* Persistence Policy Footer */}
      <footer className="py-8 px-4 flex flex-col items-center gap-4 bg-slate-50">
        <div className="max-w-xl w-full bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center gap-3 text-center">
          <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
             <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-[11px] md:text-xs text-slate-500 font-bold leading-tight">
            গুরুত্বপূর্ণ: সঠিক চিকিৎসার জন্য অবশ্যই ডাক্তারের পরামর্শ অনুসরণ করুন। এই তথ্য শুধুমাত্র সচেতনতার জন্য এবং চিকিৎসার বিকল্প নয়।
          </p>
        </div>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">© ২০২৬ বাংলা স্বাস্থ্য সহকারী এআই</p>
      </footer>
    </div>
  );
}
