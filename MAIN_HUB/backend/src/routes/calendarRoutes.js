const router = require('express').Router();
const { protect } = require('../middleware/auth');

// ============================================
// GET CALENDAR EVENTS
// ============================================
router.get('/events', protect, async (req, res) => {
    try {
        // Return mock events or fetch from database
        // You can replace this with actual database queries later
        const events = [
            // Example events - replace with your actual data
            {
                id: '1',
                title: 'Team Meeting',
                start: new Date(Date.now() + 86400000).toISOString(), // tomorrow
                end: new Date(Date.now() + 90000000).toISOString(),
                allDay: false,
                type: 'meeting',
                description: 'Weekly team sync'
            },
            {
                id: '2',
                title: 'Project Deadline',
                start: new Date(Date.now() + 172800000).toISOString(), // day after tomorrow
                end: new Date(Date.now() + 181800000).toISOString(),
                allDay: true,
                type: 'deadline',
                description: 'Submit project deliverables'
            }
        ];

        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching calendar events',
            error: error.message
        });
    }
});

// ============================================
// CREATE CALENDAR EVENT
// ============================================
router.post('/events', protect, async (req, res) => {
    try {
        const { title, start, end, allDay, type, description } = req.body;

        // Validate required fields
        if (!title || !start) {
            return res.status(400).json({
                success: false,
                message: 'Title and start date are required'
            });
        }

        // Create new event (you can save to database here)
        const newEvent = {
            id: Date.now().toString(),
            title,
            start,
            end: end || null,
            allDay: allDay || false,
            type: type || 'general',
            description: description || '',
            createdBy: req.user?._id,
            createdAt: new Date().toISOString()
        };

        res.status(201).json({
            success: true,
            data: newEvent,
            message: 'Event created successfully'
        });
    } catch (error) {
        console.error('Error creating calendar event:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating calendar event',
            error: error.message
        });
    }
});

// ============================================
// UPDATE CALENDAR EVENT
// ============================================
router.put('/events/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // In a real app, you would update the event in the database
        res.json({
            success: true,
            data: {
                id,
                ...updates,
                updatedAt: new Date().toISOString()
            },
            message: 'Event updated successfully'
        });
    } catch (error) {
        console.error('Error updating calendar event:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating calendar event',
            error: error.message
        });
    }
});

// ============================================
// DELETE CALENDAR EVENT
// ============================================
router.delete('/events/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;

        // In a real app, you would delete the event from the database
        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting calendar event',
            error: error.message
        });
    }
});

module.exports = router;