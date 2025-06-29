// pages/history/history.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    partItemList:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    const type = options.type; 
    const openid = options.openid; 
    this.setData({
      type:type==="rating"?"打分":"评价",
      openid:openid,
    })
    if (type === 'rating') {
      this.queryRatings(openid);
    } else if (type === 'comment') {
      this.queryComments(openid);
    }
  },

  queryRatings: function(openid) {
    const db = wx.cloud.database();
    db.collection('ratings')
      .where({
        _openid: openid
      })
      .get()
      .then(res => {
        const ratings = res.data;
        const ratingsIds = ratings.map(rating => rating.id);
        db.collection('part_item')
          .where({
            _id: db.command.in(ratingsIds)
          })
          .get()
          .then(res => {
            this.setData({
              partItemList:res.data
            })
          })
          .catch(err => {
            console.error('查询part_item失败:', err);
          });
      })
      .catch(err => {
        console.error('查询评分失败:', err);
      });
  },

  queryComments: function(openid) {
    const db = wx.cloud.database();
    db.collection('comments')
      .where({
        _openid: openid
      })
      .get()
      .then(res => {
        const comments = res.data;
        const commentsIds = comments.map(comment => comment.id);
        db.collection('part_item')
          .where({
            _id: db.command.in(commentsIds)
          })
          .get()
          .then(res => {
            this.setData({
              partItemList:res.data
            })
            console.log(this.data.partItemList)
          })
          .catch(err => {
            console.error('查询part_item失败:', err);
          });
      })
      .catch(err => {
        console.error('查询评论失败:', err);
      });
  },

  onPartItemTap: function(event) {
    const itemId = event.currentTarget.dataset.id;
    const itemName = event.currentTarget.dataset.name;
    const itemImage = event.currentTarget.dataset.image?event.currentTarget.dataset.image:'cloud://lin-0gefnnv9220dd9dc.6c69-lin-0gefnnv9220dd9dc-1329002260/images/add-picture.png';
    const params = `?id=${itemId}&name=${itemName}&image=${itemImage}`;
    wx.navigateTo({
      url: `/pages/detail/detail${params}`
    });
  },

onPartItemLongPress: function(e) {
  const page = this;
  const itemId = e.currentTarget.dataset.id;
  wx.showActionSheet({
    itemList: ['删除'],
    success: function(res) {
      if (res.tapIndex === 0) {
        if (page.data.type === "打分") {
          const ratingsCollection = wx.cloud.database().collection('ratings');
          ratingsCollection.where({
            id: itemId,
            _openid: page.data.openid
          }).remove({
            success: function(res) {
              console.log('删除打分记录成功');
            },
            fail: function(err) {
              console.error('删除打分记录失败', err);
            }
          });
        } else if (page.data.type === "评价") {
          const commentsCollection = wx.cloud.database().collection('comments');
          commentsCollection.where({
            id: itemId,
            _openid: page.data.openid
          }).remove({
            success: function(res) {
              console.log('删除评价记录成功');
            },
            fail: function(err) {
              console.error('删除评价记录失败', err);
            }
          });
        }
      }
    },
    fail: function(err) {
      console.error('显示操作菜单失败', err);
    }
  });
},



  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})