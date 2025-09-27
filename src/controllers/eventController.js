const supabase = require('../config/supabase');

exports.getEventSchedule = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('event_schedule')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) throw error;
    return res.status(200).json({ schedule: data });
  } catch (err) {
    console.error('getEventSchedule error:', err.message || err);
    return res.status(500).json({ message: 'Server error' });
  }
};
