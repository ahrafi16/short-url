// const express = require('express');
// const mongoose = require('mongoose');
// const ShortUrl = require('./models/shortUrl');
// const app = express();

// // MongoDB Atlas Connection
// mongoose.connect('mongodb+srv://urlshortner:KGvOTgSvPNEz9EF4@cluster0.rinnvkt.mongodb.net/urlShortener?retryWrites=true&w=majority')
//     .then(() => console.log('Connected to MongoDB Atlas'))
//     .catch(err => console.error('MongoDB connection error:', err));

// app.set('view engine', 'ejs');
// app.use(express.urlencoded({ extended: false }));

// app.get('/', async (req, res) => {
//     const shortUrls = await ShortUrl.find();
//     res.render('index', { shortUrls: shortUrls });
// })


// app.post('/shortUrls', async (req, res) => {
//     await ShortUrl.create({ full: req.body.fullUrl })
//     res.redirect('/');
// })

// app.get('/:shortUrl', async (req, res) => {
//     const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl })
//     if (shortUrl == null) return res.sendStatus(404)

//     shortUrl.clicks++
//     shortUrl.save()

//     res.redirect(shortUrl.full)
// })

// app.listen(process.env.PORT || 3000);



const express = require('express');
const mongoose = require('mongoose');
const ShortUrl = require('./models/shortUrl');
const app = express();

// Use environment variable for MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://urlshortner:KGvOTgSvPNEz9EF4@cluster0.rinnvkt.mongodb.net/urlShortener?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

app.get('/', async (req, res) => {
    const shortUrls = await ShortUrl.find();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.render('index', { shortUrls: shortUrls, baseUrl: baseUrl });
})

app.post('/shortUrls', async (req, res) => {
    await ShortUrl.create({ full: req.body.fullUrl })
    res.redirect('/');
})

app.get('/:shortUrl', async (req, res) => {
    const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl })
    if (shortUrl == null) return res.sendStatus(404)
    
    shortUrl.clicks++
    shortUrl.save()
    
    res.redirect(shortUrl.full)
})

app.listen(process.env.PORT || 3000);