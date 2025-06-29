// 云函数 addComment/index.js

const cloud = require('wx-server-sdk')

cloud.init()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  try {
    const res = await db.collection('comments').add({
      data: {
        content: event.content,
        id:event.id,
        createTime: db.serverDate(), // 使用服务器时间
        _openid: wxContext.OPENID // 用户标识
      }
    })
    return {
      success: true,
      data: res
    }
  } catch (err) {
    return {
      success: false,
      error: err
    }
  }
}
