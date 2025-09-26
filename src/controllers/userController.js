// controllers/userController.js
const supabase = require('../config/supabase');

// Get ALL users + status
exports.getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('User')
      .select('id, email, username, role, userstatus(is_banned, banned_at, reason)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getAllUsers supabase error:', error);
      return res.status(500).json({ message: 'Failed to load users', error: error.message || error });
    }

    return res.json({ success: true, users: users || [] });
  } catch (err) {
    console.error('getAllUsers error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Ban user
exports.banUser = async (req, res) => {
  const adminId = req.user?.id || null;
  const { user_id, reason } = req.body;

  if (!user_id) return res.status(400).json({ message: 'user_id is required' });

  try {
    const payload = {
      user_id: Number(user_id),
      is_banned: true,
      banned_at: new Date().toISOString(),
      reason: reason || null
    };

    const { data, error } = await supabase
      .from('userstatus')
      .upsert(payload, { onConflict: 'user_id' })
      .select();

    if (error) {
      console.error('banUser supabase error:', error);
      return res.status(500).json({ message: 'Failed to ban user', error: error.message || error });
    }

    // Log admin action
    const { error: logError } = await supabase.from('AdminActionLog').insert([{
      admin_id: adminId,
      action: 'BAN_USER',
      target_table: 'userstatus',
      target_id: String(user_id),
      created_at: new Date().toISOString()
    }]);

    if (logError) console.error('banUser log insert error:', logError);

    return res.json({ success: true, result: data });
  } catch (err) {
    console.error('banUser error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Unban user
exports.unbanUser = async (req, res) => {
  const adminId = req.user?.id || null;
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ message: 'user_id is required' });

  try {
    const { data, error } = await supabase
      .from('userstatus')
      .update({ is_banned: false, banned_at: null, reason: null })
      .eq('user_id', Number(user_id))
      .select();

    if (error) {
      console.error('unbanUser supabase error:', error);
      return res.status(500).json({ message: 'Failed to unban user', error: error.message || error });
    }

    const { error: logError } = await supabase.from('AdminActionLog').insert([{
      admin_id: adminId,
      action: 'UNBAN_USER',
      target_table: 'userstatus',
      target_id: String(user_id),
      created_at: new Date().toISOString()
    }]);

    if (logError) console.error('unbanUser log insert error:', logError);

    return res.json({ success: true, result: data });
  } catch (err) {
    console.error('unbanUser error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get one user's status
exports.getUserStatus = async (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId) return res.status(400).json({ message: 'userId required' });

  try {
    const { data, error } = await supabase
      .from('userstatus')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('getUserStatus supabase error:', error);
      return res.status(500).json({ message: 'Failed to fetch user status', error: error.message || error });
    }

    return res.json({ status: data || null });
  } catch (err) {
    console.error('getUserStatus error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
