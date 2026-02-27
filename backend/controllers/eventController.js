const supabase = require('../config/supabaseClient');
const { sortByPriority } = require('../utils/priority');

exports.getEvents = async (req, res) => {
  const { data, error } = await supabase
    .from('events')
    .select('*');

  if (error) return res.status(500).json(error);

  const sorted = sortByPriority(data);
  res.json(sorted);
};

exports.createEvent = async (req, res) => {
  const { data, error } = await supabase
    .from('events')
    .insert([req.body])
    .select();

  if (error) return res.status(500).json(error);
  res.json(data[0]);
};

exports.updateEvent = async (req, res) => {
  const { data, error } = await supabase
    .from('events')
    .update(req.body)
    .eq('id', req.params.id)
    .select();

  if (error) return res.status(500).json(error);
  res.json(data[0]);
};

exports.deleteEvent = async (req, res) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json(error);
  res.json({ message: 'Deleted successfully' });
};