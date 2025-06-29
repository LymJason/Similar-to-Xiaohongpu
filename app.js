App({

  /**
   * 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）
   */
  onLaunch: function () {
    wx.cloud.init({
      env:'xxx',//这里输入云开发id
      traceUser: true
    }),
    wx.cloud.callFunction({
      name: 'get_openId',
      success: res => {
        this.globalData.user_openid = res.result.openid
        //在数据库中查找用户是否已经登录过了
        wx.cloud.database().collection('userInfo').where({
          _openid: res.result.openid
        }).get({
          success: result => {
            this.globalData.userInfo = result.data[0]
          }
        })
      }
    })
  },

  checkLogin: function() {
    if (this.globalData.status === null) {
      wx.showToast({
        title: '暂未登录，不能使用',
        icon: 'none',
        duration: 2000
      });
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/login/login'
        });
      }, 2000);
      return false; 
    }
    return true;
  },

  saveRating: function(score, id) {
    const db = wx.cloud.database();
    const openid = this.globalData.user_openid;
    db.collection('ratings')
      .where({
        _openid: openid,
        id: id
      })
      .get({
        success: res => {
          if (res.data.length > 0) {
            const docId = res.data[0]._id; 
            const oldScore = res.data[0].score;
            const subValue = score - oldScore; 
            db.collection('ratings').doc(docId).update({
              data: {
                score: score,
                timestamp: db.serverDate() 
              },
              success: updateRes => {
                console.log('评分更新成功', updateRes);
                this.updatePartItem(id, subValue);
              },
              fail: err => {
                console.error('评分更新失败', err);
              }
            });
          } else {
            db.collection('ratings').add({
              data: {
                id: id,
                score: score,
                timestamp: db.serverDate() 
              },
              success: addRes => {
                console.log('评分添加成功', addRes);
                this.updatePartItem(id, score, true);
              },
              fail: err => {
                console.error('评分添加失败', err);
              }
            });
          }
        },
        fail: err => {
          console.error('查询评分记录失败', err);
        }
      });
  },
  
  updatePartItem: function(id, score, isAdd = false) {
    const db = wx.cloud.database();
    db.collection('part_item').doc(id).get({
      success: res => {
        if (res.data) {
          const sum = res.data.sum + (isAdd ? 1 : 0);
          const newRating = (res.data.rating * res.data.sum + score) / sum;
          db.collection('part_item').doc(id).update({
            data: {
              rating: newRating,
              sum: sum
            },
            success: updateRes => {
              console.log('part_item更新成功', updateRes);
              const pages = getCurrentPages();
              const currentPage = pages[pages.length - 1];
              currentPage.setData({
                rating: newRating.toFixed(1)*2,
                sum: sum
              });
            },
            fail: err => {
              console.error('part_item更新失败', err);
            }
          });
        }
      },
      fail: err => {
        console.error('获取part_item失败', err);
      }
    });
  },
  
  globalData: {
    status:null,
    //用户openid
    user_openid: '',
    //用户信息
    userInfo: null
  },

  /**
   * 当小程序启动，或从后台进入前台显示，会触发 onShow
   */
  onShow: function (options) {
    
  },

  /**
   * 当小程序从前台进入后台，会触发 onHide
   */
  onHide: function () {
    
  },

  /**
   * 当小程序发生脚本错误，或者 api 调用失败时，会触发 onError 并带上错误信息
   */
  onError: function (msg) {
    
  }
})
