const pagination = (page, limit) => {
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

module.exports = pagination;