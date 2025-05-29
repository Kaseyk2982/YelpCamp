const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');


module.exports.renderRegistrationForm = (req, res) => {
    res.render('users/register')
}

module.exports.createUser = catchAsync(async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) {
                return next(err);
            } else {
                req.flash('success', 'Welcome to Yelp Camp!');
                res.redirect('/campgrounds');
            }
        })

    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register')
    }
})

module.exports.renderLoginForm = (req, res) => {
    res.render('users/login');
}

module.exports.login = (req, res) => {
    const currentUser = req.user;
    req.flash('success', `Welcome Back ${currentUser.username}!`);
    const redirectUrl = res.locals.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl)
}

module.exports.logout = (req, res, next) => {
    const currentUser = req.user;
    req.logout(function (err) {
        if (err) {
            return next(err);
        }

        req.flash('success', 'Goodbye!');
        res.redirect('/campgrounds');
    });
}