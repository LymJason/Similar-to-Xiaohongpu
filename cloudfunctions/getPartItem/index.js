// 云函数入口文件 index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const db = cloud.database()
  const res = await db.collection('part_item').where({
    part: event.partItemName
  }).get()
  return {
    success: true,
    data: res.data
  }
}
