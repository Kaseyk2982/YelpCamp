const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities')
const { places, descriptors } = require('./seedhelpers');

main().catch(err => console.log(err));
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp');
    console.log('Database connected')
}

const sample = array => array[Math.floor(Math.random() * array.length)]

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 400; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20 + 10);
        const camp = new Campground({
            author: '6824e4da69c9b615388d9890',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic aspernatur qui sed eligendi debitis! Architecto tempora ipsum asperiores nostrum illo aperiam harum eveniet laborum, ad sed assumenda, aliquid quas quaerat',
            price,
            geometry: { 
              type: 'Point', 
              coordinates: [
                cities[random1000].longitude,
                cities[random1000].latitude
              ] },
            images:  [
    {
      url: 'https://res.cloudinary.com/dqjztiybv/image/upload/v1747589744/YelpCamp/rwib4xniso3f937c124g.jpg',
      filename: 'YelpCamp/rwib4xniso3f937c124g',
      
    },
    {
      url: 'https://res.cloudinary.com/dqjztiybv/image/upload/v1747589744/YelpCamp/wfztedj3s9luiynka0ji.jpg',
      filename: 'YelpCamp/wfztedj3s9luiynka0ji',
      
    },
    {
      url: 'https://res.cloudinary.com/dqjztiybv/image/upload/v1747589746/YelpCamp/fgajmqhalq371klqgpjj.jpg',
      filename: 'YelpCamp/fgajmqhalq371klqgpjj',
      
    }
  ],
        })
        await camp.save()
    }
}

seedDB().then(() => {
    mongoose.connection.close()
})