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
app.use(express.json());

// ==================== WEB ROUTES ====================
app.get('/', async (req, res) => {
    const shortUrls = await ShortUrl.find();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.render('index', { shortUrls: shortUrls, baseUrl: baseUrl });
})

// app.post('/shortUrls', async (req, res) => {
//     await ShortUrl.create({ full: req.body.fullUrl })
//     res.redirect('/');
// })

// new for customized short code
app.post('/shortUrls', async (req, res) => {
    try {
        const { fullUrl, customShort } = req.body;
        
        // If custom short code provided, check if it already exists
        if (customShort) {
            const existing = await ShortUrl.findOne({ short: customShort });
            if (existing) {
                // Handle duplicate - you can render with error or redirect
                return res.status(400).send('Short code already exists. Please choose another.');
            }
            await ShortUrl.create({ full: fullUrl, short: customShort });
        } else {
            // Generate random short code
            await ShortUrl.create({ full: fullUrl });
        }
        
        res.redirect('/');
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// ==================== API ROUTES ====================

// 1. Create a short URL
// app.post('/api/shorten', async (req, res) => {
//     try {
//         const { url } = req.body;
//         if (!url) {
//             return res.status(400).json({ error: 'URL is required' });
//         }
        
//         const shortUrl = await ShortUrl.create({ full: url });
//         const baseUrl = `${req.protocol}://${req.get('host')}`;
        
//         res.status(201).json({
//             success: true,
//             data: {
//                 fullUrl: shortUrl.full,
//                 shortUrl: `${baseUrl}/${shortUrl.short}`,
//                 shortCode: shortUrl.short,
//                 clicks: shortUrl.clicks
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// Updated to allow custom short code
app.post('/api/shorten', async (req, res) => {
    try {
        const { url, customShort } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        // If custom short code provided, check if it already exists
        if (customShort) {
            const existing = await ShortUrl.findOne({ short: customShort });
            if (existing) {
                return res.status(400).json({ error: 'Short code already exists' });
            }
        }
        
        const shortUrl = await ShortUrl.create({ 
            full: url,
            ...(customShort && { short: customShort })
        });
        
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        res.status(201).json({
            success: true,
            data: {
                fullUrl: shortUrl.full,
                shortUrl: `${baseUrl}/${shortUrl.short}`,
                shortCode: shortUrl.short,
                clicks: shortUrl.clicks
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. Get all URLs
app.get('/api/urls', async (req, res) => {
    try {
        const shortUrls = await ShortUrl.find();
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        const urls = shortUrls.map(url => ({
            fullUrl: url.full,
            shortUrl: `${baseUrl}/${url.short}`,
            shortCode: url.short,
            clicks: url.clicks
        }));
        
        res.json({
            success: true,
            count: urls.length,
            data: urls
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 3. Get specific URL info
app.get('/api/urls/:shortCode', async (req, res) => {
    try {
        const shortUrl = await ShortUrl.findOne({ short: req.params.shortCode });
        
        if (!shortUrl) {
            return res.status(404).json({ error: 'Short URL not found' });
        }
        
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        res.json({
            success: true,
            data: {
                fullUrl: shortUrl.full,
                shortUrl: `${baseUrl}/${shortUrl.short}`,
                shortCode: shortUrl.short,
                clicks: shortUrl.clicks
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 4. Delete a short URL
app.delete('/api/urls/:shortCode', async (req, res) => {
    try {
        const shortUrl = await ShortUrl.findOneAndDelete({ short: req.params.shortCode });
        
        if (!shortUrl) {
            return res.status(404).json({ error: 'Short URL not found' });
        }
        
        res.json({
            success: true,
            message: 'Short URL deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== REDIRECT ROUTE ====================
app.get('/:shortUrl', async (req, res) => {
    const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
    if (shortUrl == null) return res.sendStatus(404);
    
    shortUrl.clicks++;
    shortUrl.save();
    
    res.redirect(shortUrl.full);
})

app.listen(process.env.PORT || 3000, () => {
    console.log('Server running on port', process.env.PORT || 3000);
});