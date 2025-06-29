const cloud = require('wx-server-sdk')

cloud.init()

// 更新评分
exports.updateRating = async (event, context) => {
  const db = cloud.database()
  const { itemId, userRating } = event

  try {
    const item = await db.collection('part_item').doc(itemId).get()
    if (!item.data) {
      throw new Error('Item not found')
    }
    const { rating, sum } = item.data
    const newSum = sum + 1
    const newRating = (rating * sum + userRating) / newSum
    await db.collection('part_item').doc(itemId).update({
      data: {
        rating: newRating,
        sum: newSum
      }
    })
    return {
      success: true,
      data: {
        rating: newRating,
        sum: newSum
      }
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      error: err.message
    }
  }
}
