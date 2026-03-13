const User = require('../models/user.model');
const Achievement = require('../models/Achievement');
const Task = require('../models/Task');
const notificationController = require('./notification.controller');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Reward logic constants
 */
const POINTS_CONFIG = {
    TASK_COMPLETED: 10,
    FOCUS_SESSION: 50,
    DAILY_LOGIN: 5,
    STREAK_BONUS_BASE: 5,
};

/**
 * Handle point rewards and progression
 */
exports.rewardPoints = async (userId, action, metadata = {}) => {
    try {
        const user = await User.findById(userId);
        if (!user) return null;

        let pointsToAdd = 0;
        let achievementMessage = '';

        switch (action) {
            case 'task_completed':
                pointsToAdd = POINTS_CONFIG.TASK_COMPLETED;
                user.totalTasksDone += 1;
                // Add streak bonus if streak > 1
                if (user.streak > 1) {
                    pointsToAdd += Math.min(user.streak * POINTS_CONFIG.STREAK_BONUS_BASE, 50);
                }
                break;
            case 'focus_session_completed':
                pointsToAdd = POINTS_CONFIG.FOCUS_SESSION;
                break;
            case 'daily_login':
                pointsToAdd = POINTS_CONFIG.DAILY_LOGIN;
                break;
            default:
                pointsToAdd = metadata.points || 0;
        }

        const oldLevel = user.level || 1;
        user.points += pointsToAdd;

        // Level formula: Level = floor(sqrt(totalPoints / 100)) + 1
        // Level 1: 0-99
        // Level 2: 100-399
        // Level 3: 400-899
        // Level 4: 900-1599
        const newLevel = Math.floor(Math.sqrt(user.points / 100)) + 1;

        let levelUp = false;
        if (newLevel > oldLevel) {
            user.level = newLevel;
            levelUp = true;
            console.log(`🚀 User ${user.name} leveled up to ${newLevel}!`);

            // Notify user of level up
            await notificationController.createNotification(
                userId,
                'level_up',
                '🏆 Level Up!',
                `Congratulations! You've reached Level ${newLevel}. Your productivity is soaring!`,
                '/dashboard'
            );
        }

        await user.save();

        return {
            pointsAdded: pointsToAdd,
            totalPoints: user.points,
            level: user.level,
            levelUp
        };

    } catch (error) {
        console.error('Gamification Error:', error);
        return null;
    }
};

/**
 * Get user's gamification stats (for dashboard)
 */
exports.getStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('achievements.achievementId')
            .select('points level streak longestStreak achievements totalTasksDone');

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Calculate XP for current and next level
        // currentLevelXP = (level - 1)^2 * 100
        // nextLevelXP = level^2 * 100
        const currentLevelStartXP = Math.pow(user.level - 1, 2) * 100;
        const nextLevelXP = Math.pow(user.level, 2) * 100;
        const xpInCurrentLevel = user.points - currentLevelStartXP;
        const xpRequiredForNextLevel = nextLevelXP - currentLevelStartXP;
        const totalTasks = await Task.countDocuments({ createdBy: req.user.id });

        res.json({
            level: user.level,
            points: user.points,
            totalTasksDone: user.totalTasksDone,
            totalTasks: totalTasks,
            streak: user.streak,
            longestStreak: user.longestStreak,
            progress: {
                currentXP: xpInCurrentLevel,
                requiredXP: xpRequiredForNextLevel,
                percentage: Math.round(progressPercentage),
                nextLevel: user.level + 1
            },
            achievements: user.achievements
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
/**
 * Reward points specifically for arcade games
 */
exports.rewardGamePoints = async (req, res) => {
    try {
        const { score } = req.body;
        // Game reward formula: score / 10 = XP (capped at 50 per session)
        const pointsToAdd = Math.min(Math.floor(score / 10), 50);

        if (pointsToAdd <= 0) {
            return res.json({ success: true, pointsAdded: 0 });
        }

        const result = await exports.rewardPoints(req.user.id, 'arcade_game', { points: pointsToAdd });

        res.json({
            success: true,
            pointsAdded: pointsToAdd,
            totalPoints: result.totalPoints,
            level: result.level,
            levelUp: result.levelUp
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Generate and download a professional PDF productivity report
 */
exports.downloadReport = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const tasks = await Task.find({ createdBy: req.user.id, completed: true }).limit(5).sort({ updatedAt: -1 });

        const doc = new PDFDocument({ margin: 50 });
        let filename = `ZenTask_Report_${user.name.replace(/\s+/g, '_')}.pdf`;

        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);        // Header - Logo (single centered logo)
        const logoPathSeal = path.join(__dirname, '../assets/bait_logo.png');
        const pageWidth = doc.page.width;
        const logoY = 40;

        if (fs.existsSync(logoPathSeal)) {
            const logoYPosition = logoY + 50;
            
            // Center Circle (Seal)
            doc.save()
               .circle(pageWidth / 2, logoYPosition, 60)
               .fillAndStroke('white', '#e2e8f0')
               .restore();

            // Draw logo centered
            doc.image(logoPathSeal, (pageWidth / 2) - 50, logoY, { width: 100, height: 100 });

            // Academic Header Text
            doc.y = logoY + 115;
            doc.fillColor('#1e293b')
               .fontSize(16)
               .font('Helvetica-Bold')
               .text('BANNARI AMMAN INSTITUTE OF TECHNOLOGY', { align: 'center' });
            
            doc.moveDown(0.2);
            doc.fillColor('#64748b')
               .fontSize(10)
               .font('Helvetica')
               .text('An Autonomous Institution | Accredited by NAAC with A+ Grade', { align: 'center' });
            
            doc.moveDown(1.5);
            doc.fillColor('#0f172a')
               .fontSize(24)
               .font('Helvetica-Bold')
               .text('PRODUCTIVITY REPORT', { align: 'center', characterSpacing: 1 });
            
            doc.moveDown(0.5);
            doc.fillColor('#64748b')
               .fontSize(10)
               .font('Helvetica')
               .text(`Date of Emission: ${new Date().toLocaleDateString()} | Time: ${new Date().toLocaleTimeString()}`, { align: 'center' });
            
            // Decorative line
            doc.moveDown(1);
            doc.moveTo(100, doc.y).lineTo(pageWidth - 100, doc.y).lineWidth(1).stroke('#e2e8f0');
            doc.moveDown(2);
        }

        // User Identity
        doc.fillColor('#1e293b').fontSize(14).text('COMMANDER IDENTITY', { tracking: 2 });
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#e2e8f0');
        doc.moveDown();

        doc.fontSize(12).fillColor('#334155').text(`Name: ${user.name}`);
        doc.text(`Email: ${user.email}`);
        doc.text(`Operational Role: ${user.role.toUpperCase()}`);
        doc.moveDown(2);

        // Performance Metrics
        doc.fillColor('#1e293b').fontSize(14).text('PERFORMANCE METRICS', { tracking: 2 });
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#e2e8f0');
        doc.moveDown();

        doc.fontSize(12).fillColor('#334155');
        const totalTasksFull = await Task.countDocuments({ createdBy: req.user.id });
        const productivityScore = totalTasksFull > 0 ? Math.round((user.totalTasksDone / totalTasksFull) * 100) : 0;

        doc.text(`Current Rank: Level ${user.level}`);
        doc.text(`Total Experience points (XP): ${user.points}`);
        doc.text(`Combat Streak: ${user.streak} Days`);
        doc.text(`Mission Success Rate: ${productivityScore}%`);
        doc.text(`Total Tasks Neutralized: ${user.totalTasksDone}`);
        doc.moveDown(2);

        // Recent Accomplishments
        doc.fillColor('#1e293b').fontSize(14).text('RECENT MISSION DEBRIEF', { tracking: 2 });
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#e2e8f0');
        doc.moveDown();

        if (tasks.length > 0) {
            tasks.forEach((task, index) => {
                doc.fontSize(11).fillColor('#475569').text(`${index + 1}. ${task.title}`);
                const completedAt = new Date(task.completedAt || task.updatedAt);
                const completedStr = completedAt.toLocaleDateString() + ', ' + completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                doc.fontSize(9).fillColor('#94a3b8').text(`   Success confirmed on: ${completedStr}`);

                doc.moveDown(0.5);
            });
        } else {
            doc.fontSize(12).fillColor('#94a3b8').text('No recent mission logs available.');
        }

        // Footer
        const bottom = doc.page.height - 100;
        doc.fontSize(10).fillColor('#6366f1').text('ZEN TASK INTELLIGENCE UNIT', 50, bottom, { align: 'center' });
        doc.fontSize(8).fillColor('#94a3b8').text('Confidential - Personal Productivity Analysis', { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('PDF Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to generate report' });
        }
    }
};
