import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getUser } from '../api';
import {
    queueSkillGapAnalysis,
    getSkillAnalysisTaskStatus,
    getLatestSkillAnalysisTask,
    getActiveSkillAnalysisTasks
} from '../services/skillAnalysisService';

const SkillAnalysisQueueContext = createContext(null);

const STORAGE_KEY = 'saarthi_skill_analyses_v1';

export const SkillAnalysisQueueProvider = ({ children }) => {
    // completedAnalyses: { [targetKey]: result } where targetKey = `${type}:${name}`
    const [completedAnalyses, setCompletedAnalyses] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // activeTasks: array of { taskId, targetName, targetType, status, progressStep, startedAt }
    const [activeTasks, setActiveTasks] = useState([]);

    // recentlyFinished: { targetName, targetType, taskId, timestamp }
    const [recentlyFinished, setRecentlyFinished] = useState(null);

    const pollingRef = useRef(null);

    // Save completed analyses to localStorage whenever updated
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(completedAnalyses));
        } catch (e) {
            console.error('Failed to persist completed analyses:', e);
        }
    }, [completedAnalyses]);

    const getTargetKey = (name, type) => `${type || 'company'}:${(name || '').trim().toLowerCase()}`;

    // ── On Initial Load: Check DB for active tasks for this logged-in user ──
    useEffect(() => {
        const checkInitialActiveTasks = async () => {
            const user = getUser();
            if (!user || !user.email) return;

            try {
                const res = await getActiveSkillAnalysisTasks(user.email);
                if (res && res.active_tasks && res.active_tasks.length > 0) {
                    const formatted = res.active_tasks.map(t => ({
                        taskId: t.task_id,
                        targetName: t.target_name,
                        targetType: t.target_type,
                        status: t.status,
                        progressStep: t.progress_step || 'Processing...',
                        startedAt: t.created_at || new Date().toISOString()
                    }));
                    setActiveTasks(formatted);
                }
            } catch (err) {
                console.warn('Could not fetch active tasks on boot:', err);
            }
        };

        checkInitialActiveTasks();
    }, []);

    // ── Background Polling Worker ──────────────────────────────────────────
    useEffect(() => {
        if (activeTasks.length === 0) {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            return;
        }

        const pollTasks = async () => {
            for (const task of activeTasks) {
                try {
                    const statusData = await getSkillAnalysisTaskStatus(task.taskId);
                    if (!statusData) continue;

                    if (statusData.status === 'completed' && statusData.result) {
                        const targetKey = getTargetKey(statusData.target_name, statusData.target_type);
                        
                        // Save completed result
                        setCompletedAnalyses(prev => ({
                            ...prev,
                            [targetKey]: statusData.result
                        }));

                        // Trigger completion toast
                        setRecentlyFinished({
                            targetName: statusData.target_name,
                            targetType: statusData.target_type,
                            taskId: statusData.task_id,
                            timestamp: Date.now()
                        });

                        // Remove from active tasks
                        setActiveTasks(prev => prev.filter(t => t.taskId !== task.taskId));
                    } else if (statusData.status === 'failed') {
                        console.error(`Task ${task.taskId} failed:`, statusData.error);
                        setActiveTasks(prev => prev.filter(t => t.taskId !== task.taskId));
                    } else if (statusData.progress_step && statusData.progress_step !== task.progressStep) {
                        // Update progress step
                        setActiveTasks(prev => prev.map(t => 
                            t.taskId === task.taskId ? { ...t, progressStep: statusData.progress_step } : t
                        ));
                    }
                } catch (err) {
                    console.warn(`Polling failed for task ${task.taskId}:`, err);
                }
            }
        };

        // Poll every 2.5 seconds
        pollingRef.current = setInterval(pollTasks, 2500);

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [activeTasks]);

    // ── Enqueue New Analysis ───────────────────────────────────────────────
    const enqueueAnalysis = useCallback(async (studentData, targetData) => {
        const user = getUser();
        const userEmail = user?.email || studentData?.email || 'guest';
        const targetKey = getTargetKey(targetData.name, targetData.type);

        const response = await queueSkillGapAnalysis(studentData, targetData, userEmail);

        if (response.status === 'completed' && response.result) {
            // Instant cache hit
            setCompletedAnalyses(prev => ({
                ...prev,
                [targetKey]: response.result
            }));
            return {
                status: 'completed',
                taskId: response.task_id,
                result: response.result,
                cached: true
            };
        }

        // Add to active queue
        const newTask = {
            taskId: response.task_id,
            targetName: targetData.name,
            targetType: targetData.type,
            status: response.status || 'queued',
            progressStep: response.progress_step || 'Enqueued in analysis queue...',
            startedAt: new Date().toISOString()
        };

        setActiveTasks(prev => {
            const exists = prev.some(t => t.taskId === newTask.taskId);
            return exists ? prev : [...prev, newTask];
        });

        return {
            status: response.status || 'queued',
            taskId: response.task_id
        };
    }, []);

    // ── Check if a target has analysis or is running ────────────────────────
    const getTargetState = useCallback((targetName, targetType) => {
        const targetKey = getTargetKey(targetName, targetType);
        const activeTask = activeTasks.find(
            t => (t.targetName || '').toLowerCase() === (targetName || '').toLowerCase() &&
                 (t.targetType || '').toLowerCase() === (targetType || '').toLowerCase()
        );
        const completedResult = completedAnalyses[targetKey] || null;

        return {
            isAnalyzing: !!activeTask,
            activeTask: activeTask || null,
            result: completedResult
        };
    }, [activeTasks, completedAnalyses]);

    // ── Fetch past latest analysis for this target from DB if needed ───────
    const fetchLatestForTarget = useCallback(async (targetName, targetType) => {
        const user = getUser();
        if (!user || !user.email || !targetName) return null;

        const targetKey = getTargetKey(targetName, targetType);
        if (completedAnalyses[targetKey]) {
            return completedAnalyses[targetKey];
        }

        try {
            const res = await getLatestSkillAnalysisTask(user.email, targetName, targetType);
            if (res && res.found && res.task) {
                if (res.task.status === 'completed' && res.task.result) {
                    setCompletedAnalyses(prev => ({
                        ...prev,
                        [targetKey]: res.task.result
                    }));
                    return res.task.result;
                } else if (res.task.status === 'queued' || res.task.status === 'processing') {
                    // Re-register active task
                    setActiveTasks(prev => {
                        const exists = prev.some(t => t.taskId === res.task.task_id);
                        if (exists) return prev;
                        return [...prev, {
                            taskId: res.task.task_id,
                            targetName: res.task.target_name,
                            targetType: res.task.target_type,
                            status: res.task.status,
                            progressStep: res.task.progress_step,
                            startedAt: res.task.created_at
                        }];
                    });
                }
            }
        } catch (e) {
            console.warn('Error fetching latest task for target:', e);
        }
        return null;
    }, [completedAnalyses]);

    const dismissRecentlyFinished = useCallback(() => {
        setRecentlyFinished(null);
    }, []);

    const clearTargetAnalysis = useCallback((targetName, targetType) => {
        const targetKey = getTargetKey(targetName, targetType);
        setCompletedAnalyses(prev => {
            const copy = { ...prev };
            delete copy[targetKey];
            return copy;
        });
    }, []);

    const value = {
        activeTasks,
        completedAnalyses,
        recentlyFinished,
        enqueueAnalysis,
        getTargetState,
        fetchLatestForTarget,
        dismissRecentlyFinished,
        clearTargetAnalysis
    };

    return (
        <SkillAnalysisQueueContext.Provider value={value}>
            {children}
        </SkillAnalysisQueueContext.Provider>
    );
};

export const useSkillAnalysisQueue = () => {
    const context = useContext(SkillAnalysisQueueContext);
    if (!context) {
        throw new Error('useSkillAnalysisQueue must be used within a SkillAnalysisQueueProvider');
    }
    return context;
};
