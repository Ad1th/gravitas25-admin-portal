const supabase = require('../config/supabase');

// To Ban a user (upsert into UserStatus) + log action
exports.banUser = async (req, res) => {
  const adminId = req.user?.id;
  const { user_id, reason, banned_until } = req.body;

  if (!user_id) return res.status(400).json({ message: 'user_id is required' });

  try {
    const payload = {
      user_id: Number(user_id),
      is_banned: true,
      banned_at: new Date().toISOString(),
      reason: reason || null,
      // updated_at: new Date().toISOString() // optional; Supabase may ignore unknown fields if not in table
    };

    const { data, error } = await supabase
      .from('UserStatus')
      .upsert(payload, { onConflict: 'user_id' })
      .select();

    if (error) throw error;

    // Log admin action
    await supabase.from('AdminActionLog').insert([{
      admin_id: adminId,
      action: 'BAN_USER',
      target_table: 'UserStatus',
      target_id: String(user_id)
    }]);

    return res.json({ success: true, result: data });
  } catch (err) {
    console.error('banUser error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Unban a user and log action
exports.unbanUser = async (req, res) => {
  const adminId = req.user?.id;
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ message: 'user_id is required' });

  try {
    const { data, error } = await supabase
      .from('UserStatus')
      .update({ is_banned: false, banned_at: null, reason: null })
      .eq('user_id', Number(user_id))
      .select();

    if (error) throw error;

    await supabase.from('AdminActionLog').insert([{
      admin_id: adminId,
      action: 'UNBAN_USER',
      target_table: 'UserStatus',
      target_id: String(user_id)
    }]);

    return res.json({ success: true, result: data });
  } catch (err) {
    console.error('unbanUser error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get a user's status (ban info)
exports.getUserStatus = async (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId) return res.status(400).json({ message: 'userId required' });

  try {
    const { data, error } = await supabase
      .from('UserStatus')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return res.json({ status: data || null });
  } catch (err) {
    console.error('getUserStatus error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
