const { pool } = require("../config/database");
const ApiError = require("../utils/ApiError");
const { buildPaginationMeta, getPagination } = require("../utils/pagination");
const { deleteLocalUpload } = require("../utils/file");
const { slugify } = require("../utils/slug");

const productSortMap = {
  latest: "p.created_at DESC",
  oldest: "p.created_at ASC",
  price_asc: "p.price ASC",
  price_desc: "p.price DESC"
};

const parseJsonArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return [];
  }
};

const formatProduct = (row) => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  description: row.description,
  price: Number(row.price),
  conditionLabel: row.conditionLabel,
  status: row.status,
  campusLocation: row.campusLocation,
  faculty: row.faculty,
  imageUrl: row.imageUrl,
  isWishlisted: Boolean(row.isWishlisted),
  createdAt: row.createdAt,
  soldAt: row.soldAt,
  pendingOfferCount: Number(row.pendingOfferCount || 0),
  category: {
    id: row.categoryId,
    name: row.categoryName
  },
  seller: {
    id: row.sellerId,
    fullName: row.sellerName,
    avatarUrl: row.sellerAvatar,
    ratingAverage: Number(row.sellerRatingAverage || 0),
    ratingCount: Number(row.sellerRatingCount || 0),
    campus: row.sellerCampus
  }
});

const ensureCategoryExists = async (categoryId) => {
  const [rows] = await pool.query("SELECT id FROM categories WHERE id = ? LIMIT 1", [categoryId]);

  if (!rows.length) {
    throw new ApiError(422, "Kategori tidak ditemukan.");
  }
};

const generateUniqueSlug = async (title, ignoredProductId = null) => {
  const baseSlug = slugify(title) || "produk";
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const params = [candidate];
    let sql = "SELECT id FROM products WHERE slug = ?";

    if (ignoredProductId) {
      sql += " AND id <> ?";
      params.push(ignoredProductId);
    }

    sql += " LIMIT 1";
    const [rows] = await pool.query(sql, params);

    if (!rows.length) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
};

const getProducts = async (query, currentUserId = null) => {
  const { limit, offset, page } = getPagination(query);
  const conditions = ["p.deleted_at IS NULL", "p.status = 'active'", "u.is_suspended = 0"];
  const params = [];

  if (query.search) {
    conditions.push("(p.title LIKE ? OR p.description LIKE ? OR c.name LIKE ? OR p.campus_location LIKE ? OR p.faculty LIKE ?)");
    const keyword = `%${query.search}%`;
    params.push(keyword, keyword, keyword, keyword, keyword);
  }

  if (query.categoryId) {
    conditions.push("p.category_id = ?");
    params.push(query.categoryId);
  }

  if (query.minPrice) {
    conditions.push("p.price >= ?");
    params.push(query.minPrice);
  }

  if (query.maxPrice) {
    conditions.push("p.price <= ?");
    params.push(query.maxPrice);
  }

  if (query.faculty) {
    conditions.push("p.faculty = ?");
    params.push(query.faculty);
  }

  if (currentUserId) {
    conditions.push("p.seller_id <> ?");
    params.push(currentUserId);
  }

  const whereClause = conditions.join(" AND ");
  const sort = productSortMap[query.sort] || productSortMap.latest;

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     INNER JOIN users u ON u.id = p.seller_id
     WHERE ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      p.id,
      p.title,
      p.slug,
      p.price,
      p.condition_label AS conditionLabel,
      p.status,
      p.campus_location AS campusLocation,
      p.faculty,
      p.image_url AS imageUrl,
      p.created_at AS createdAt,
      c.id AS categoryId,
      c.name AS categoryName,
      u.id AS sellerId,
      u.full_name AS sellerName,
      u.avatar_url AS sellerAvatar,
      u.rating_average AS sellerRatingAverage,
      u.rating_count AS sellerRatingCount,
      u.campus AS sellerCampus,
      ${currentUserId ? "(SELECT COUNT(*) FROM wishlists w WHERE w.product_id = p.id AND w.user_id = ?) AS isWishlisted" : "0 AS isWishlisted"}
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     INNER JOIN users u ON u.id = p.seller_id
     WHERE ${whereClause}
     ORDER BY ${sort}
     LIMIT ? OFFSET ?`,
    currentUserId ? [currentUserId, ...params, limit, offset] : [...params, limit, offset]
  );

  return {
    products: rows.map(formatProduct),
    meta: buildPaginationMeta({ page, limit, total: Number(countRows[0].total || 0) })
  };
};

const getMyProducts = async (userId) => {
  const [rows] = await pool.query(
    `SELECT
      p.id,
      p.title,
      p.slug,
      p.description,
      p.price,
      p.condition_label AS conditionLabel,
      p.status,
      p.campus_location AS campusLocation,
      p.faculty,
      p.image_url AS imageUrl,
      p.created_at AS createdAt,
      p.sold_at AS soldAt,
      c.id AS categoryId,
      c.name AS categoryName,
      u.id AS sellerId,
      u.full_name AS sellerName,
      u.avatar_url AS sellerAvatar,
      u.rating_average AS sellerRatingAverage,
      u.rating_count AS sellerRatingCount,
      u.campus AS sellerCampus,
      (SELECT COUNT(*) FROM offers o WHERE o.product_id = p.id AND o.status = 'pending') AS pendingOfferCount
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     INNER JOIN users u ON u.id = p.seller_id
     WHERE p.seller_id = ? AND p.deleted_at IS NULL
     ORDER BY p.created_at DESC`,
    [userId]
  );

  return rows.map(formatProduct);
};

const getProductById = async (productId, currentUserId = null) => {
  const [rows] = await pool.query(
    `SELECT
      p.id,
      p.title,
      p.slug,
      p.description,
      p.price,
      p.condition_label AS conditionLabel,
      p.status,
      p.campus_location AS campusLocation,
      p.faculty,
      p.image_url AS imageUrl,
      p.created_at AS createdAt,
      p.sold_at AS soldAt,
      c.id AS categoryId,
      c.name AS categoryName,
      u.id AS sellerId,
      u.full_name AS sellerName,
      u.avatar_url AS sellerAvatar,
      u.rating_average AS sellerRatingAverage,
      u.rating_count AS sellerRatingCount,
      u.campus AS sellerCampus,
      ${currentUserId ? "(SELECT COUNT(*) FROM wishlists w WHERE w.product_id = p.id AND w.user_id = ?) AS isWishlisted" : "0 AS isWishlisted"}
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     INNER JOIN users u ON u.id = p.seller_id
     WHERE p.id = ? AND p.deleted_at IS NULL
     LIMIT 1`,
    currentUserId ? [currentUserId, productId] : [productId]
  );

  if (!rows.length) {
    throw new ApiError(404, "Produk tidak ditemukan.");
  }

  await pool.query("UPDATE products SET view_count = view_count + 1 WHERE id = ?", [productId]);

  const product = formatProduct(rows[0]);
  product.isOwner = currentUserId ? product.seller.id === currentUserId : false;

  const [reviews] = await pool.query(
    `SELECT
      r.id,
      r.rating,
      r.communication_rating AS communicationRating,
      r.item_accuracy_rating AS itemAccuracyRating,
      r.meetup_rating AS meetupRating,
      r.tags,
      r.is_anonymous AS isAnonymous,
      r.comment,
      r.created_at AS createdAt,
      reviewer.id AS reviewerId,
      CASE WHEN r.is_anonymous = 1 THEN 'Mahasiswa BabePus' ELSE reviewer.full_name END AS reviewerName,
      reviewer.avatar_url AS reviewerAvatar
     FROM reviews r
     INNER JOIN users reviewer ON reviewer.id = r.reviewer_id
     WHERE r.seller_id = ?
     ORDER BY r.created_at DESC
     LIMIT 10`,
    [product.seller.id]
  );

  return {
    ...product,
    reviews: reviews.map((review) => ({
      ...review,
      tags: parseJsonArray(review.tags),
      isAnonymous: Boolean(review.isAnonymous)
    }))
  };
};

const createProduct = async (sellerId, payload, imageUrl) => {
  await ensureCategoryExists(payload.categoryId);
  const slug = await generateUniqueSlug(payload.title);

  const [result] = await pool.query(
    `INSERT INTO products
      (seller_id, category_id, title, slug, description, price, condition_label, campus_location, faculty, image_url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      sellerId,
      payload.categoryId,
      payload.title,
      slug,
      payload.description,
      payload.price,
      payload.conditionLabel,
      payload.campusLocation,
      payload.faculty || null,
      imageUrl
    ]
  );

  return getProductById(result.insertId, sellerId);
};

const assertProductOwner = async (productId, userId, allowAdmin = false, role = "user") => {
  const [rows] = await pool.query(
    "SELECT id, seller_id AS sellerId, image_url AS imageUrl, status FROM products WHERE id = ? AND deleted_at IS NULL LIMIT 1",
    [productId]
  );

  if (!rows.length) {
    throw new ApiError(404, "Produk tidak ditemukan.");
  }

  if (!allowAdmin || role !== "admin") {
    if (rows[0].sellerId !== userId) {
      throw new ApiError(403, "Anda hanya bisa mengelola produk milik sendiri.");
    }
  }

  return rows[0];
};

const updateProduct = async (productId, user, payload, imageUrl = null) => {
  const product = await assertProductOwner(productId, user.id, true, user.role);

  if (payload.categoryId) {
    await ensureCategoryExists(payload.categoryId);
  }

  const title = payload.title || null;
  const slug = title ? await generateUniqueSlug(title, productId) : null;

  await pool.query(
    `UPDATE products
     SET
      category_id = COALESCE(?, category_id),
      title = COALESCE(?, title),
      slug = COALESCE(?, slug),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      condition_label = COALESCE(?, condition_label),
      campus_location = COALESCE(?, campus_location),
      faculty = ?,
      image_url = COALESCE(?, image_url)
     WHERE id = ?`,
    [
      payload.categoryId || null,
      title,
      slug,
      payload.description || null,
      payload.price || null,
      payload.conditionLabel || null,
      payload.campusLocation || null,
      payload.faculty || null,
      imageUrl,
      productId
    ]
  );

  if (imageUrl && product.imageUrl && product.imageUrl !== imageUrl) {
    await deleteLocalUpload(product.imageUrl);
  }

  return getProductById(productId, user.id);
};

const deleteProduct = async (productId, user) => {
  const product = await assertProductOwner(productId, user.id, true, user.role);

  await pool.query(
    `UPDATE products
     SET status = 'archived', deleted_at = NOW()
     WHERE id = ?`,
    [productId]
  );

  await pool.query(
    "UPDATE offers SET status = 'auto_rejected' WHERE product_id = ? AND status = 'pending'",
    [productId]
  );

  if (product.imageUrl) {
    await deleteLocalUpload(product.imageUrl);
  }

  return { id: productId };
};

const markProductSold = async (productId, user) => {
  await assertProductOwner(productId, user.id, false, user.role);

  await pool.query(
    `UPDATE products
     SET status = 'sold', sold_at = NOW()
     WHERE id = ? AND status = 'active'`,
    [productId]
  );

  await pool.query(
    "UPDATE offers SET status = 'auto_rejected' WHERE product_id = ? AND status = 'pending'",
    [productId]
  );

  return getProductById(productId, user.id);
};

module.exports = {
  createProduct,
  deleteProduct,
  getMyProducts,
  getProductById,
  getProducts,
  markProductSold,
  updateProduct
};
