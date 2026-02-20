const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/workspace.controller');

// Workspace management
router.post('/', auth, controller.createWorkspace);
router.get('/', auth, controller.getUserWorkspaces);
router.get('/:id', auth, controller.getWorkspace);

// Member management
router.post('/:id/members', auth, controller.inviteMember);
router.delete('/:id/members/:memberId', auth, controller.removeMember);
router.put('/:id/members/:memberId/role', auth, controller.updateMemberRole);

// Switch workspace
router.post('/:id/switch', auth, controller.switchWorkspace);

module.exports = router;
