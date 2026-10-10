import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle2, ArrowRight, X, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { useSkillAnalysisQueue } from '../context/SkillAnalysisQueueContext';

const SkillAnalysisQueueWidget = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { activeTasks, recentlyFinished, dismissRecentlyFinished } = useSkillAnalysisQueue();

    const isAlreadyOnSkillsPage = location.pathname.includes('/app/skills');

    // If no active tasks and no recently finished toast, render nothing
    if (activeTasks.length === 0 && !recentlyFinished) {
        return null;
    }

    return (
        <aside aria-label="Skill Analysis Notifications" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            <AnimatePresence>
                {/* ── Active Background Processing Widget ── */}
                {activeTasks.map((task) => (
                    <motion.div
                        key={task.taskId}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="pointer-events-auto bg-[#FACC15] border-[3px] border-[#0F0F0F] p-4 shadow-[6px_6px_0px_#0F0F0F] flex flex-col gap-2"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-[#0F0F0F] text-[#FACC15] flex items-center justify-center font-black">
                                    <Loader2 size={14} className="animate-spin" />
                                </span>
                                <span className="font-black text-xs uppercase tracking-wider text-[#0F0F0F]">
                                    AI Analysis in Queue
                                </span>
                            </div>
                            <span className="bg-[#0F0F0F] text-white text-[10px] font-black px-1.5 py-0.5 uppercase">
                                Background
                            </span>
                        </div>

                        <div>
                            <h4 className="font-black text-sm text-[#0F0F0F] leading-tight truncate">
                                {task.targetName}
                            </h4>
                            <p className="font-bold text-[11px] text-[#0F0F0F] opacity-80 mt-0.5 line-clamp-1">
                                {task.progressStep || 'Processing skills against requirement vectors...'}
                            </p>
                        </div>

                        <div className="w-full bg-white h-2 border-2 border-[#0F0F0F] overflow-hidden mt-1">
                            <motion.div
                                className="h-full bg-[#F97316]"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                style={{ width: '50%' }}
                            />
                        </div>

                        {!isAlreadyOnSkillsPage && (
                            <button
                                onClick={() => navigate(`/app/skills?target=${encodeURIComponent(task.targetName)}&type=${encodeURIComponent(task.targetType)}`)}
                                className="mt-1 w-full bg-white hover:bg-[#FFFBF0] text-[#0F0F0F] font-black text-xs py-1.5 border-[2px] border-[#0F0F0F] flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#0F0F0F] hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                            >
                                <BookOpen size={13} /> View Skill Section
                            </button>
                        )}
                    </motion.div>
                ))}

                {/* ── Completion Toast Notification ── */}
                {recentlyFinished && (
                    <motion.div
                        key="finished-toast"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="pointer-events-auto bg-[#A3E635] border-[3px] border-[#0F0F0F] p-4 shadow-[6px_6px_0px_#0F0F0F] flex flex-col gap-2 relative"
                    >
                        <button
                            onClick={dismissRecentlyFinished}
                            className="absolute top-2.5 right-2.5 w-6 h-6 bg-white border-2 border-[#0F0F0F] flex items-center justify-center font-black text-[#0F0F0F] hover:bg-[#FACC15] transition-colors"
                        >
                            <X size={12} />
                        </button>

                        <div className="flex items-center gap-2 pr-6">
                            <span className="w-6 h-6 bg-[#0F0F0F] text-[#A3E635] flex items-center justify-center font-black">
                                <Sparkles size={14} />
                            </span>
                            <span className="font-black text-xs uppercase tracking-wider text-[#0F0F0F]">
                                Analysis Ready!
                            </span>
                        </div>

                        <div>
                            <h4 className="font-black text-sm text-[#0F0F0F] leading-tight">
                                {recentlyFinished.targetName}
                            </h4>
                            <p className="font-bold text-[11px] text-[#0F0F0F] opacity-90 mt-0.5">
                                Your personalized AI learning roadmap and gap analysis is prepared.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                dismissRecentlyFinished();
                                navigate(`/app/skills?target=${encodeURIComponent(recentlyFinished.targetName)}&type=${encodeURIComponent(recentlyFinished.targetType)}`);
                            }}
                            className="mt-1 w-full bg-[#0F0F0F] hover:bg-[#222222] text-white font-black text-xs py-2 border-[2px] border-[#0F0F0F] flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#FFFBF0] hover:shadow-[1px_1px_0px_#FFFBF0] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                        >
                            <CheckCircle2 size={14} className="text-[#A3E635]" /> View Analysis Now
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </aside>
    );
};

export default SkillAnalysisQueueWidget;
