require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const client = new MongoClient( process.env.MONGO_DB );
const db = client.db('urlShortener');
const urls = db.collection('urls');

const dns = require('dns');
const urlparser = require('url');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', (req, res) => {
  const url = req.body.url;

  const dnsLookup = dns.lookup(urlparser.parse(url, false).hostname, async ( err, address ) => {
    if ( !address ){
      res.json({
        error: 'Invalid URL'
      })
    } else {

      const urlCount = await urls.countDocuments({});
      const urlDoc = {
        url,
        short_url: urlCount
      };

      const result = await urls.insertOne(urlDoc);

      res.json({
        original_url: url,
        short_url: urlCount
      })

    }

  } )
  
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const shorturl = req.params.short_url;
  const urlDoc = await urls.findOne({ short_url: +shorturl });
  res.redirect(urlDoc.url);

});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
