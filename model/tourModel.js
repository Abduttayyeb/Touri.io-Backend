const mongoose = require('mongoose')
const slugify  = require('slugify')
const validator = require('validator')
// const User = require('./userModel')

const tourSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique:true,
      trim:true,
      maxlength : [40, 'A tour name must have less or equal than 40 characters'],
      minlength : [10, 'A tour name must have more or equal than 10 characters'],
      validator: [validator.isAlpha,'Tour name must only contain characters' ]
    }, 
    slug: String,
    duration: {
      type:Number,
      required:[true, 'A tour must have duration']
    },
    maxGroupSize : {
      type:Number,
      required:[true,'A tour must have a group size']
    },
    difficulty:{
      type:String,
      required:[true,'A tour must have a difficulty'],
      enum:{
        values : ['easy', 'medium', 'difficult'],
        message : 'Difficulty is either : easy, medium, difficult'
      } 
    },
    ratingsAverage: {
      type:Number,
      default:4.5,
      min: [1,'Ratings must be above 1.0'],
    	max: [5,'Ratings must be below 5.0'],
    },
    ratingsQuantity:{
      type:Number,
      default:0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount:{
      type:Number,
      validate:{
          validator : function(val) {
            // this will point towards the current doc of newly created document,
            return val < this.price;
          },
          message:'Discount price ({VALUE}) should be below the regular price.'
      } 
    },
    summary:{
      type:String,
      trim:true,
      required:[true, 'A tour must have a description']
    },
    description:{
      type:String,
      trim:true
    },
    imageCover:{
      type:String,
      required:[true,'A tour must have a cover image']    
    },
    images: [String],
    createdAt:{
      type:Date,
      default:Date.now(),
      select:false
    },
    startDates: [Date],
    secretTour:{
      type:String,
      default:false
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
      }
    ]
}, { 
  toJSON: {virtuals: true},
  toObject: {virtuals: true}
})

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
})

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
})

// -------------------------------------- DOCUMENT MIDDLEWARE ------------------------------------------

tourSchema.pre('save',function(next) {
  this.slug = slugify(this.name, {lower:true});
  next();
})

//-------Embedding guides--------

// tourSchema.pre('save',async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id))
//   console.log(guidesPromises)
//   this.guides = await Promise.all(guidesPromises)
//   next()
// })

// tourSchema.pre('save',function(next) {
//   console.log("Will save document...")
//   next();
// })

// tourSchema.post('save',function(doc,next) {
//   console.log(doc)
//   next();
// })

// -----------------------------------------------------------------------------------------------------

// --------------------------------------QUERY MIDDLEWARE ----------------------------------------------

tourSchema.pre(/^find/,function(next) { 
  this.find({ secretTour: {$ne: true} })

  // this.start = Date.now()
  next()
})

tourSchema.pre(/^find/,function(next) {
  this.populate({
    path:'guides',
    select: '-__v -passwordChangedAt'
    })
  next()
})

// tourSchema.post(/^find/,function(docs,next) {
//   console.log(`Query took ${Date.now()-this.start} ms `)
//   console.log(docs);
//   next()
// })

// -----------------------------------------------------------------------------------------------------


// --------------------------------------AGGREGATION MIDDLEWARE ----------------------------------------

tourSchema.pre('aggregate',function(next) {
  this.pipeline().unshift({ $match : { secretTour : {$ne: true} } }); //adding in the beginning.
  console.log(this.pipeline()) // this is going to point to the current aggregation object.
  next()
})

// -----------------------------------------------------------------------------------------------------


const Tour = mongoose.model('Tour',tourSchema);
module.exports = Tour
