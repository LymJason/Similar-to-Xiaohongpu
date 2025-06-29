// pages/login/login.js
const app = getApp()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
Page({

  data: {
    avatarUrl:defaultAvatarUrl,
    nickName:null,
    user_openid:null
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    const cloudPath = `avatars/${app.globalData.user_openid}.png`;
    wx.cloud.uploadFile({
    cloudPath,
    filePath: avatarUrl,
    success: res => {
      const fileId = res.fileID;
      this.setData({
        avatarUrl: fileId
      });
    },
    fail: err => {
      wx.showToast({
        title: '头像上传失败',
        icon: 'none'
      });
      console.error('头像上传失败', err);
    }
  });
  },

  formSubmit(e){
    const that = this
    const nickName=e.detail.value.nickname
    app.globalData.status=app.globalData.user_openid
    this.setData({
      nickName:nickName
    })
    this.setData({
      user_openid:app.globalData.user_openid
    })
    app.globalData.status=app.globalData.user_openid;
    console.log(app.globalData.user_openid,app.globalData.status)
    wx.cloud.database().collection('userInfo').where({
      _openid: app.globalData.user_openid
    }).get({
      success: res => {
        if (!res.data[0]) {
          wx.cloud.database().collection('userInfo').add({
            data: {
              avatarUrl: that.data.avatarUrl,
              nickName: that.data.nickName
            },
            success: res => {
              wx.showToast({
                title: '登录成功',
                icon: 'none'
              })
            }
          })
        } else {
          if ((that.data.avatarUrl !== res.data[0].avatarUrl)||(that.data.nickName!==res.data[0].nickName)) {
            wx.cloud.database().collection('userInfo').doc(res.data[0]._id).update({
              data: {
                avatarUrl: that.data.avatarUrl,
                nickName:that.data.nickName
              },
              success: updateRes => {
                console.log('头像或昵称更新成功', updateRes);
                this.setData({
                  avatarUrl: that.data.avatarUrl,
                  nickName:that.data.nickName
                });
              },
              fail: err => {
                console.error('头像或昵称更新失败', err);
                wx.showToast({
                  title: '头像或昵称更新失败',
                  icon: 'none'
                });
              }
            });
          }
        }
      }
    })
  },

  logout(){
    app.globalData.userInfo = null
    app.globalData.status=null
    console.log(app.globalData.status)
    this.setData({
      nickName:null,
      user_openid:null
    })
  },

  history_rating: function() {
    wx.navigateTo({
      url: '/pages/history/history?type=rating&openid=' + this.data.user_openid
    });
  },

  history_comment: function() {
    wx.navigateTo({
      url: '/pages/history/history?type=comment&openid=' + this.data.user_openid
    });
  },

  history_blog:function(){
    wx.navigateTo({
      url: '/pages/historyblog/historyblog?type=comment&openid=' + this.data.user_openid
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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
    console.log(app.globalData.userInfo)
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