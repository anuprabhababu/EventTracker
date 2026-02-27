const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const supabase = require('../config/supabaseClient');

router.post('/:type', upload.single('file'), async (req, res) => {
  const bucket = req.params.type === 'certificate'
    ? 'certificates'
    : 'brochures';

  const fileName = `${Date.now()}-${req.file.originalname}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, req.file.buffer);

  if (error) return res.status(500).json(error);

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  res.json({ url: data.publicUrl });
});

module.exports = router;