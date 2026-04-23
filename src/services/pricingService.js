const { pool } = require("../config/database");

const conditionFactor = {
  like_new: 0.82,
  good: 0.68,
  fair: 0.52,
  needs_repair: 0.34
};

const categoryFactor = {
  elektronik: 0.86,
  "laptop-aksesoris": 0.82,
  "buku-kuliah": 0.58,
  "kost-furniture": 0.55,
  "alat-tulis": 0.5,
  "jaket-almamater": 0.64,
  "perlengkapan-praktikum": 0.72,
  "sepeda-transport": 0.66,
  "fashion-kampus": 0.48,
  lainnya: 0.56
};

const urgencyFactor = {
  low: 1.06,
  normal: 1,
  high: 0.92
};

const estimateUsedPrice = async (payload) => {
  const [categories] = await pool.query("SELECT id, name, slug FROM categories WHERE id = ? LIMIT 1", [
    payload.categoryId
  ]);
  const category = categories[0] || { id: payload.categoryId, name: "Kategori", slug: "lainnya" };

  const base = Number(payload.originalPrice || 0);
  const ageMonths = Number(payload.ageMonths || 0);
  const depreciation = Math.max(0.58, 1 - Math.min(ageMonths, 60) * 0.009);
  const boxBonus = payload.includesBox ? 1.04 : 0.98;
  const factor =
    (conditionFactor[payload.conditionLabel] || 0.58) *
    (categoryFactor[category.slug] || categoryFactor.lainnya) *
    depreciation *
    boxBonus *
    (urgencyFactor[payload.urgency || "normal"] || 1);

  const median = Math.max(1000, Math.round((base * factor) / 1000) * 1000);
  const suggestedMin = Math.max(1000, Math.round((median * 0.9) / 1000) * 1000);
  const suggestedMax = Math.max(suggestedMin, Math.round((median * 1.12) / 1000) * 1000);

  return {
    category,
    originalPrice: base,
    suggestedMin,
    suggestedMedian: median,
    suggestedMax,
    confidence: ageMonths <= 36 ? "high" : "medium",
    factors: {
      condition: payload.conditionLabel,
      categoryDemand: categoryFactor[category.slug] || categoryFactor.lainnya,
      depreciation: Number(depreciation.toFixed(2)),
      includesBox: Boolean(payload.includesBox),
      urgency: payload.urgency || "normal"
    },
    advice:
      payload.urgency === "high"
        ? "Gunakan harga median atau minimum agar barang lebih cepat laku."
        : "Pasang harga mendekati batas atas jika barang lengkap, bersih, dan siap COD."
  };
};

module.exports = { estimateUsedPrice };
