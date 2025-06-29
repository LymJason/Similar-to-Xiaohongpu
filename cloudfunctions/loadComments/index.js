// 云函数：loadComments
const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const db = cloud.database();
  const _ = db.command;

  const res = await db.collection('comments')
    .aggregate()
    .match({
      id: event.id
    })
    .lookup({
      from: 'userInfo',
      localField: '_openid',
      foreignField: '_openid',
      as: 'userInfo'
    })
    .lookup({
      from: 'replies',
      localField: '_id',
      foreignField: 'id',
      as: 'replies'
    })
    .lookup({
      from: 'userInfo',
      localField: 'replies._openid',
      foreignField: '_openid',
      as: 'replyUserInfo'
    })
    .end();

  return res.list;
};