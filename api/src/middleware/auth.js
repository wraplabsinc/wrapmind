const jwt = require('jsonwebtoken');
const config = require('../config');
const { supabaseAdmin } = require('../config/database');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

async function requireOwner(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role, org_id')
      .eq('id', req.user.id)
      .single();

    if (!user || user.role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }

    req.userOrgId = user.org_id;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Permission check failed' });
  }
}

module.exports = { authenticateToken, requireRole, requireOwner };
