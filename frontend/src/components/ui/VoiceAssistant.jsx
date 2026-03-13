import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Sparkles, X, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';

const VoiceAssistant = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPanel, setShowPanel] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error("Speech recognition not supported in this browser");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
            setIsListening(true);
            setShowPanel(true);
        };

        recognitionRef.current.onresult = (event) => {
            const current = event.resultIndex;
            const resultTranscript = event.results[current][0].transcript;
            setTranscript(resultTranscript);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
            if (transcript) {
                processTranscript(transcript);
            }
        };

        recognitionRef.current.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
            toast.error("Voice recognition failed. Try again.");
        };
    }, [transcript]);

    const startListening = () => {
        setTranscript('');
        recognitionRef.current?.start();
    };

    const stopListening = () => {
        recognitionRef.current?.stop();
    };

    const processTranscript = async (text) => {
        setIsProcessing(true);
        try {
            // 1. Ask AI to parse transcript
            const res = await api.post('/ai/voice-command', { transcript: text });
            const taskData = res.data.task;

            if (taskData && taskData.title) {
                // 2. Automatically create task
                await api.post('/tasks', taskData);
                toast.success(`Mission Launched: ${taskData.title}`, {
                    description: `Priority: ${taskData.priority} | Category: ${taskData.category}`,
                    icon: <Sparkles className="text-amber-500" />
                });
                
                // Refresh views
                window.dispatchEvent(new CustomEvent("refresh-tasks"));
                
                // Close panel after success
                setTimeout(() => {
                    setShowPanel(false);
                    setTranscript('');
                }, 2000);
            }
        } catch (error) {
            console.error("Process Transcript Error:", error);
            toast.error("AI couldn't interpret that command.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
                <AnimatePresence>
                    {showPanel && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl w-80 mb-2 overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 p-8 bg-primary-500/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                            
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        isListening ? "bg-rose-500 animate-pulse" : "bg-slate-500"
                                    )} />
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                        {isListening ? "Listening..." : isProcessing ? "AI Interpreting..." : "Command Recognized"}
                                    </span>
                                </div>
                                <button onClick={() => setShowPanel(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="min-h-[60px] flex items-center justify-center text-center px-2">
                                {isProcessing ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="text-primary-400 animate-spin" size={24} />
                                        <p className="text-slate-500 text-xs font-bold italic">Extracting mission data...</p>
                                    </div>
                                ) : (
                                    <p className={cn(
                                        "text-lg font-bold leading-tight",
                                        transcript ? "text-white" : "text-slate-600 italic"
                                    )}>
                                        {transcript || "Speak now..."}
                                    </p>
                                )}
                            </div>

                            {!isListening && !isProcessing && transcript && (
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }}
                                    className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-primary-400"
                                >
                                    <Wand2 size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Auto-scheduling Mission</span>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={isListening ? stopListening : startListening}
                    className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 relative group",
                        isListening 
                            ? "bg-rose-600 text-white ring-8 ring-rose-600/20" 
                            : "bg-slate-900 border border-white/10 text-primary-400 hover:bg-slate-800"
                    )}
                >
                    {isListening && (
                        <span className="absolute inset-0 rounded-full bg-rose-600 animate-ping opacity-25" />
                    )}
                    {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                    
                    {!isListening && !showPanel && (
                        <div className="absolute right-full mr-4 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10">
                            AI Voice Support
                        </div>
                    )}
                </motion.button>
            </div>
        </>
    );
};

export default VoiceAssistant;
