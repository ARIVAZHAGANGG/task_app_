const { GoogleGenerativeAI } = require("@google/generative-ai");
const { differenceInDays, differenceInHours, isAfter, isBefore, parseISO } = require('date-fns');
const Task = require('../models/Task');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

class AIService {
    /**
     * Helper to check if AI is properly configured
     */
    isConfigured() {
        const key = process.env.GEMINI_API_KEY;
        console.log("🔹 AI Service: Checking key configuration...");
        const isSet = key && key.trim() !== "" && key !== "placeholder" && key.length > 20;
        console.log(`🔹 AI Service: Key configured: ${isSet}`);
        return isSet;
    }

    /**
     * Generate a smart breakdown of subtasks based on task title/description
     */
    async generateTaskBreakdown(title, description = "") {
        try {
            if (!this.isConfigured()) {
                return ["Analyze requirements", "Implement core logic", "Final testing"];
            }

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Break down the following task into 3-5 actionable subtasks:
                Task: ${title}
                Description: ${description}
                
                Respond ONLY with a JSON array of strings. Example: ["Step 1", "Step 2"]`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON array
            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return text.split('\n').filter(line => line.trim()).map(line => line.replace(/^[-*0-9.]+\s*/, '').trim()).slice(0, 5);
        } catch (error) {
            console.error("Gemini Breakdown Error:", error);
            return ["Analyze requirements", "Implement core logic", "Final testing"];
        }
    }

    /**
     * Suggest priority based on AI understanding and due date
     */
    async suggestSmartPriority(title, dueDate) {
        try {
            // Local logic fallback first
            const localPriority = this.suggestPriority({ dueDate });

            if (!this.isConfigured()) {
                return localPriority;
            }

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Based on the task name and its due date, suggest a priority (high, medium, or low).
                Task: ${title}
                Due Date: ${dueDate || "No deadline"}
                Current Time: ${new Date().toISOString()}
                
                Respond ONLY with the single word: high, medium, or low.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().toLowerCase().trim();

            if (['high', 'medium', 'low'].includes(text)) {
                return text;
            }
            return localPriority;
        } catch (error) {
            return this.suggestPriority({ dueDate });
        }
    }

    /**
     * Generate a motivating dashboard summary
     */
    async generateDashboardSummary(stats) {
        try {
            if (!this.isConfigured()) {
                return `You have ${stats.pendingTasks} tasks pending. Keep going!`;
            }

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Generate a very short (1 sentence), motivating productivity insight for a user based on these stats:
                - Total Tasks: ${stats.totalTasks}
                - Completed: ${stats.completedTasks}
                - Pending: ${stats.pendingTasks}
                - Productivity Score: ${stats.productivityScore}%
                
                Be encouraging and concise.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            return "Focus. Execute. Dominate. You've got this!";
        }
    }

    /**
     * Suggest priority based on due date (Legacy/Local Logic)
     */
    suggestPriority(task) {
        if (!task.dueDate) return 'medium';
        const now = new Date();
        const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
        if (isAfter(now, dueDate)) return 'high';

        const hoursUntilDue = differenceInHours(dueDate, now);
        if (hoursUntilDue < 24) return 'high';
        if (hoursUntilDue <= 72) return 'medium';
        return 'low';
    }

    /**
     * Get comprehensive AI analysis
     */
    async getTaskSuggestions(task, userId) {
        const smartPriority = await this.suggestSmartPriority(task.title, task.dueDate);
        const estimatedTime = 60; // Placeholder for now
        const riskAnalysis = this.detectOverdueRisk({ ...task, estimatedTime });

        return {
            suggestedPriority: smartPriority,
            estimatedTime,
            riskAnalysis,
            recommendations: this._generateRecommendations(task, smartPriority, riskAnalysis)
        };
    }

    detectOverdueRisk(task) {
        if (!task.dueDate) return { riskLevel: 'none', riskPercentage: 0, message: 'No due date set' };
        const now = new Date();
        const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
        if (isAfter(now, dueDate)) return { riskLevel: 'critical', riskPercentage: 100, message: 'Task is overdue!' };

        const hoursUntilDue = differenceInHours(dueDate, now);
        const estimatedTimeHours = (task.estimatedTime || 60) / 60;
        const timeBuffer = hoursUntilDue - estimatedTimeHours;

        if (timeBuffer < 0) return { riskLevel: 'critical', riskPercentage: 100, message: 'Insufficient time to complete!' };
        if (timeBuffer < 6) return { riskLevel: 'high', riskPercentage: 85, message: 'Deadline is approaching fast!' };
        if (timeBuffer < 24) return { riskLevel: 'medium', riskPercentage: 50, message: 'Moderate risk - stay focused' };
        return { riskLevel: 'low', riskPercentage: 20, message: 'Comfortable timeline' };
    }

    async _generateRecommendations(task, priority, risk) {
        const recommendations = [];
        if (risk.riskLevel === 'critical') recommendations.push('🚨 Start this task immediately!');
        if (priority === 'high' && task.priority !== 'high') recommendations.push('📌 AI suggests high priority');
        if (task.subtasks?.length > 5) recommendations.push('✂️ Break this down further');
        if (!task.dueDate) recommendations.push('📅 Add a deadline for better tracking');
        return recommendations;
    }

    /**
     * AI Support Assistant Response (Enhanced & Dynamic)
     */
    async getChatResponse(userId, message) {
        console.log("🔹 AI Service: Initiating chat response for userId:", userId);
        try {
            // 1. Fetch Context Data
            const User = require('../models/user.model');
            const user = await User.findById(userId);
            const tasks = await Task.find({ createdBy: userId });
            console.log("🔹 AI Service: Context data fetched for user:", user?.name);

            const stats = this._calculateStats(tasks);
            const productivityScore = this._calculateProductivityScore(stats);

            const contextPrompt = `
                User Name: ${user?.name || "User"}
                Total Tasks: ${stats.totalTasks}
                Completed: ${stats.completedTasks}
                Pending: ${stats.pendingTasks}
                Overdue: ${stats.overdueTasks}
                Current Streak: ${user?.streak || 0} days
                Productivity Score: ${productivityScore}%
            `;

            if (!this.isConfigured()) {
                return `[AI Offline] Hi ${user?.name || "User"}, I'm currently running in limited mode. You have ${stats.pendingTasks} tasks pending. Please configure my Gemini API key for full intelligence!`;
            }

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: "System Prompt: You are ZenTask AI Assistant. Help users manage tasks, productivity, streaks, and reminders. Give short, clear, actionable answers. If user asks about streak -> explain streak logic (consecutive days of completion). If user asks about tasks -> give productivity advice. Be friendly but professional. Use the following context for responses: " + contextPrompt }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "Understood. I am your ZenTask AI Assistant, equipped with your current statistics and ready to help you optimize your workflow. How can I assist you today?" }],
                    },
                ],
            });

            console.log("🔹 AI Service: Sending message to Gemini...");
            const result = await chat.sendMessage(message);
            const response = await result.response;
            const text = response.text().trim();
            console.log("🔹 AI Service: Received response from Gemini");
            return text;

        } catch (error) {
            console.error("AI Chat Response Error:", error);
            return "I'm having a technical glitch, but don't let that stop your momentum! Focus on your pending tasks.";
        }
    }

    _calculateStats(tasks) {
        const stats = {
            totalTasks: tasks.length,
            completedTasks: 0,
            pendingTasks: 0,
            overdueTasks: 0
        };

        const now = new Date();
        tasks.forEach(t => {
            if (t.completed) {
                stats.completedTasks++;
            } else {
                stats.pendingTasks++;
                if (t.dueDate && isBefore(new Date(t.dueDate), now)) {
                    stats.overdueTasks++;
                }
            }
        });
        return stats;
    }

    _calculateProductivityScore(stats) {
        if (stats.totalTasks === 0) return 100;
        let score = (stats.completedTasks / stats.totalTasks) * 100;
        score -= (stats.overdueTasks * 5);
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * AI Support Assistant Response (Legacy/Page Context)
     */
    async getSupportResponse(query, context = {}) {
        // ... existing getSupportResponse logic if needed, but we'll focus on getChatResponse
        return this.getChatResponse(context.userId, query);
    }

    _getRuleBasedFallback(query, context) {
        // ... (keep fallback as secondary safety)
        return "I'm here to help with ZenTask! You can ask me how to create tasks, manage your schedule, or improve your productivity score.";
    }
    /**
     * Parse a voice transcript into a structured task object
     */
    async parseVoiceCommand(transcript) {
        try {
            if (!this.isConfigured()) {
                // Return basic task if AI is offline
                return {
                    title: transcript,
                    priority: 'medium',
                    category: 'Other'
                };
            }

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Convert this voice command into a structured task object.
                Command: "${transcript}"
                Current Date: ${new Date().toISOString()}
                
                Respond ONLY with a JSON object. Fields:
                - title (string, mandatory)
                - description (string, optional)
                - priority (low, medium, high)
                - category (Work, Personal, Health, Urgent, Other)
                - dueDate (ISO string if mentioned, else omit)
                
                Example: {"title": "Buy milk", "priority": "low", "category": "Personal"}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{.*\}/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return { title: transcript, priority: 'medium', category: 'Other' };
        } catch (error) {
            console.error("Gemini Voice Parse Error:", error);
            return { title: transcript, priority: 'medium', category: 'Other' };
        }
    }

    /**
     * Suggest an optimal reminder time for a task using AI
     */
    async suggestReminderTime(taskContext) {
        try {
            if (!this.isConfigured()) {
                const today = new Date();
                today.setHours(9, 0, 0, 0);
                return today.toISOString();
            }

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Based on this task context, suggest the single best reminder time.
                Task: "${taskContext.title}"
                Priority: ${taskContext.priority}
                Due Date: ${taskContext.dueDate || 'Not set'}
                Current Time: ${new Date().toISOString()}
                
                Respond ONLY with the ISO date string for the reminder. 
                Choose a time during business hours (9AM-6PM) unless the task seems urgent.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            const dateMatch = text.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
            return dateMatch ? dateMatch[0] : new Date().toISOString();
        } catch (error) {
            console.error("Gemini Reminder Suggest Error:", error);
            return new Date().toISOString();
        }
    }
}

module.exports = new AIService();
