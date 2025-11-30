const express = require('express');
const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/shorten', async (req, res) => {
  const { originalUrl } = req.body;
  const shortId = nanoid(6);

  await pool.query(
    'INSERT INTO urls (short_id, original_url, clicks) VALUES ($1, $2, 0)',
    [shortId, originalUrl]
  );

  res.render('index', { shortUrl: `${req.headers.host}/${shortId}` });
});

app.get('/:id', async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    'SELECT * FROM urls WHERE short_id=$1',
    [id]
  );

  if (result.rows.length === 0) return res.send('URL not found');

  const url = result.rows[0];

  await pool.query(
    'UPDATE urls SET clicks = clicks + 1 WHERE short_id=$1',
    [id]
  );

  res.redirect(url.original_url);
});

app.get('/stats/:id', async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    'SELECT * FROM urls WHERE short_id=$1',
    [id]
  );

  if (result.rows.length === 0) return res.send('Stats not found');

  res.json(result.rows[0]);
});

app.listen(3000, () => console.log('Server running on port 3000'));