// Reusable query-building helper used by every "list" controller (documents, files,
// meetings, notifications, etc.) to keep pagination/filtering/sorting consistent
// and avoid duplicating this logic across controllers.
class ApiFeatures {
  constructor(query, queryString) {
    this.query = query; // a Mongoose Query object, e.g. Document.find({...})
    this.queryString = queryString; // req.query
  }

  // ?search=keyword -> case-insensitive match against provided fields
  search(fields = []) {
    if (this.queryString.search && fields.length) {
      const regex = new RegExp(this.queryString.search, "i");
      this.query = this.query.find({ $or: fields.map((field) => ({ [field]: regex })) });
    }
    return this;
  }

  filter(allowedFields = []) {
    const queryObj = { ...this.queryString };
    ["page", "limit", "sort", "search", "fields"].forEach((field) => delete queryObj[field]);

    const filtered = {};
    Object.keys(queryObj).forEach((key) => {
      if (allowedFields.length === 0 || allowedFields.includes(key)) {
        filtered[key] = queryObj[key];
      }
    });

    this.query = this.query.find(filtered);
    return this;
  }

  sort(defaultSort = "-createdAt") {
    const sortBy = this.queryString.sort ? this.queryString.sort.split(",").join(" ") : defaultSort;
    this.query = this.query.sort(sortBy);
    return this;
  }

  paginate(defaultLimit = 20) {
    const page = Math.max(parseInt(this.queryString.page, 10) || 1, 1);
    const limit = Math.min(parseInt(this.queryString.limit, 10) || defaultLimit, 100);
    const skip = (page - 1) * limit;

    this.pagination = { page, limit };
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = ApiFeatures;
