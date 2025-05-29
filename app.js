if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const passport = require('passport');
const passportLocal = require('passport-local');
const User = require('./models/user');
const sanitizeV5 = require('./utils/mongoSanitizeV5.js');
const helmet = require('helmet');


const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');

const campgroundRoutes = require('./Routes/campgrounds');
const reviewRoutes = require('./Routes/reviews');
const userRoutes = require('./Routes/users');
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp';



async function main() {
    // Check if connection is already open
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(dbUrl, {

        });
        console.log('Database connected');
    } else {
        console.log('Database already connected');
    }
}


main().catch(err => console.log('Connection error:', err));

app.engine('ejs', ejsMate);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('query parser', 'extended');

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(sanitizeV5({ replaceWith: '_' }));

const secret = process.env.SECRET || 'Thisshouldbeabettersecret';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: 'thisshouldbeabettersecret!'
    }
});

store.on("error", function (e) {
    console.log('session store error', e)
})

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());

app.use(helmet());

const scriptSrcUrls = [
    "https://cdn.jsdelivr.net", // Bootstrap and Popper.js
    "https://api.mapbox.com", // Mapbox GL JS
    "https://*.mapbox.com", // Broader wildcard for Mapbox subdomains
    "https://cdnjs.cloudflare.com",
];
const styleSrcUrls = [
    "https://cdn.jsdelivr.net", // Bootstrap
    "https://api.mapbox.com", // Mapbox GL CSS
    "https://*.mapbox.com", // Broader wildcard
    "https://fonts.googleapis.com", // If used in app.css
];
const connectSrcUrls = [
    "https://api.mapbox.com",
    "https://*.tiles.mapbox.com",
    "https://events.mapbox.com",
    "wss://*.mapbox.com",
];
const fontSrcUrls = [
    "https://fonts.gstatic.com", // Google Fonts
    "https://*.mapbox.com", // Mapbox fonts (if needed)
];

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'self'", "'unsafe-inline'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: ["'none'"],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dqjztiybv/",
                "https://images.unsplash.com",
                "https://*.tiles.mapbox.com",
                "https://api.mapbox.com",
                "https://media.istockphoto.com", // Fallback image in index.ejs
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
            reportTo: "/csp-violations",
        },
    })
);

app.post('/csp-violations', (req, res) => {
    console.log('CSP Violation:', req.body);
    res.status(204).end()
});



app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);
app.use('/', userRoutes);



app.get('/', (req, res) => {
    res.render('home')
})

app.all(/(.*)/, (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})



app.use((err, req, res, next) => {
    const { status = 500 } = err;
    if (!err.message) err.message = 'Oh no, something went wrong!'
    res.status(status).render('error', { err })

})


app.listen(3000, () => {
    console.log('Listening on port 3000');
})