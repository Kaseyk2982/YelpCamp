const express = require('express');
const router = express.Router();
const Campground = require('../models/campground');
const campgrounds = require('../controllers/campgrounds');
const { isLoggedin, isAuthor, validateCampground } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });


router.route('/')
    .get(campgrounds.index)
    .post(isLoggedin, validateCampground, upload.array('image'), campgrounds.postNewCampground);

router.get('/search', campgrounds.search);    
   

router.get('/new', isLoggedin, campgrounds.renderNewForm);

router.route('/:id')
    .get(campgrounds.showCampground)
    .put(isLoggedin, isAuthor, upload.array('image'), validateCampground, campgrounds.editCampground)
    .delete(isLoggedin, isAuthor, campgrounds.deleteCampground);

router.get('/:id/edit', isLoggedin, isAuthor, campgrounds.renderEditForm);


module.exports = router;