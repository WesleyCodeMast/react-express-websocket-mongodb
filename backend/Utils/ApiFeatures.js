class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const filter_name = this.queryStr.filter_name
      ? {
          name: {
            $regex: this.queryStr.filter_name,
            $options: "i",
          },
        }
      : {};

      const filter_email = this.queryStr.filter_email
      ? {
          email: {
            $regex: this.queryStr.filter_email,
            $options: "i",
          },
        }
      : {};

      const filter_mobile = this.queryStr.filter_mobile
      ? {
          mobile: {
            $regex: this.queryStr.filter_mobile,
            $options: "i",
          },
        }
      : {};


      const type = this.queryStr.type
      ? {
          type: this.queryStr.type
        }
      : {};


    this.query = this.query.find({ ...filter_name, ...filter_email, ...filter_mobile, ...type });
    return this;
  }

  filter() {
    const queryCopy = { ...this.queryStr };
    //   Removing some fields for category
    const removeFields = ["filter_name", "page", "limit", "size", "type"];

    removeFields.forEach((key) => delete queryCopy[key]);

    // Filter For Price and Rating

    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

    this.query = this.query.find(JSON.parse(queryStr));
    this.query = this.query.select('_id name email mobile type address state createdAt');

    return this;
  }

  pagination(resultPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;

    const skip = resultPerPage * (currentPage - 1);

    this.query.totalCount = this.query.length;

    this.query = this.query.limit(resultPerPage).skip(skip).sort({$natural:-1});
    // this.query = this.query.limit(resultPerPage).skip(skip).sort({$natural:-1}).populate(['booking_customers', 'chambal_booking', 'safari_booking', 'package_booking']);

    return this;
  }
}

module.exports = ApiFeatures;