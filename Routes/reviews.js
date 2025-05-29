const express = require('express');
const router = express.Router({ mergeParams: true });
const ExpressError = require('../utils/ExpressError');
const Review = require('../models/review');
const Campground = require('../models/campground');
const { reviewSchema } = require('../schemas.js');
const {validateReview, isLoggedin, isReviewAuthor} = require('../middleware');
const reviews = require('../controllers/reviews');



router.post('/', isLoggedin, validateReview, reviews.postReview)

router.delete('/:reviewId', isLoggedin, isReviewAuthor, reviews.deleteReview)

module.exports = router;