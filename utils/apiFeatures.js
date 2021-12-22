class APIFeatures {
    constructor(query,queryString){
        this.query = query               // this will contain mongoose query so that we don't have to call Tour.find() inside.
        this.queryString = queryString   // query from express route eg: { difficulty: 'easy', duration: '5' }
    }

    filter(){
        //eg:- 127.0.0.1:8000/api/v1/tours?difficulty=easy?duration=5

        const queryObj = { ...this.queryString } 
        const excludedFields = ['page','sort','limit','fields'] 
        excludedFields.forEach(el => delete queryObj[el])

        // 1B) Advanced Filtering
        //eg:- 127.0.0.1:8000/api/v1/tours?difficulty=easy?duration[gte]=5

        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g,match => `$${match}`)

        this.query = this.query.find(JSON.parse(queryStr)) //same as Tour.find()

        return this; // returning the entire object because we have further more features to chain
    }

    sort(){
        if (this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ');
            console.log(sortBy) 
            this.query = this.query.sort(sortBy) // (price ratingsAverage)
        } else {
            this.query = this.query.sort('-createdAt') 
        }

        return this;
    }

    limitFields() {
        if (this.queryString.fields){
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields)
            //mongoose expects -> eg:query.select('name duration price')
        } else {
            this.query = this.query.select('-__v')
            //excluding __v created by mongoose
        }
        
        return this
    }

    paginate() {
        const page = this.queryString.page *1 || 1;
        const limit = this.queryString.limit *1 || 100;
        const skip = (page-1)*limit

        //page=2&limit=10 -> 1-10(page1), 11-20(page2)
        //query = query.skip(10).limit(10) // skipping 10 results to get to (11-20)

        this.query = this.query.skip(skip).limit(limit)

        return this;
    }
}

module.exports = APIFeatures