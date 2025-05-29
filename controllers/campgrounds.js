const Campground = require('../models/campground');
const catchAsync = require('../utils/catchAsync');
const { cloudinary } = require('../cloudinary');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapboxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapboxToken });

module.exports.index = catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds, mapToken: process.env.MAPBOX_TOKEN })
});

module.exports.search = catchAsync(async (req, res) => {
    const { query } = req.query;
    if (!query) {
        req.flash('error', 'Enter a state in the search field')
        return res.redirect('/campgrounds');
    }
    let normalizedQuery = query.trim().replace(/\s+/g, ' ');
    // If no comma, assume space separates city and state, add comma
    if (!normalizedQuery.includes(',')) {
        normalizedQuery = normalizedQuery.replace(' ', ', ');
    }
    const campgrounds = await Campground.find({ location: { $regex: normalizedQuery, $options: 'i' } });
    if (campgrounds.length === 0) {
        req.flash('error', `Could not find and campgrounds in ${query}`)
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/search', { campgrounds, query });
})

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new')
}

module.exports.postNewCampground = catchAsync(async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send();
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id;
    await campground.save();
    console.log(campground);
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${campground._id}`)

})

module.exports.showCampground = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!campground) {
        req.flash('error', 'Could not find campground!');
        return res.redirect('/campgrounds');
    }

    res.render('campgrounds/show', { campground })
})

module.exports.renderEditForm = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(req.params.id);
    if (!campground) {
        req.flash('error', 'Could not find campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground })
})

module.exports.editCampground = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    console.log(req.body);
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs);
    await campground.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
        console.log(campground)
    }
    req.flash('success', 'Successfully updated campground')
    res.redirect(`/campgrounds/${campground._id}`);
})

module.exports.deleteCampground = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'Could not find Campground!');
        return res.redirect('/campgrounds');
    }
    for (let image of campground.images) {
        await cloudinary.uploader.destroy(image.filename);
    }
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground!');
    res.redirect('/campgrounds');
})