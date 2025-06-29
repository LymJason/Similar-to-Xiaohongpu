const app=getApp()
Page({
  data: {
    stars: [0, 1, 2, 3, 4],
    normalSrc: '../../images/star1.png',
    selectedSrc: '../../images/star2.png',
    select: 0,
    one: '非常不满意',
    two: '不满意',
    three: '一般',
    four: '满意',
    five: '非常满意',
    id: '', 
    name: '',
    rating: '',
    sum: '',
    image:'',
    comments: [],
    imageFileID:'',
    imagePath:'',
    user_openid:''
  },

  chooseMedia: function() {
    const that = this;
    wx.chooseMedia({
      count: 1, 
      sourceType: ['album', 'camera'], 
      success: function(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        console.log(tempFilePath);
        that.setData({
          imagePath: tempFilePath
        });
        that.uploadImageToCloud(tempFilePath);
      }
    })
  },

  uploadImageToCloud: function(filePath) {
    const that = this;
    wx.cloud.uploadFile({
      cloudPath: 'images/' + new Date().getTime() + '.jpg', 
      filePath: filePath,
      success: res => {
        const imageFileID = res.fileID; 
        that.setData({
          imageFileID: imageFileID 
        }, () => {
          that.updateItemImage(imageFileID);
        });
      },
      fail: err => {
        console.error(err);
      }
    });
  },

  updateItemImage: function(imageFileID) {
    const db = wx.cloud.database();
    const _ = db.command;
    db.collection('part_item').doc(this.data.id).update({
      data: {
        image: imageFileID 
      },
    })
    .then(() => {
      console.log('Image updated successfully');
    })
    .catch(err => {
      console.error('Failed to update image:', err);
    });
  },

  onInput: function(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  onSend: function() {
    if (!app.checkLogin()) {
      return; 
    }
    const content = this.data.inputValue;
    console.log(content,this.data.inputValue);
    const id = this.data.id;
    if (content.trim() !== '') {

      wx.cloud.callFunction({
        name: 'addComment', 
        data: {
          content: content ,
          id:id
        },
        success: res => {
          console.log('评论上传成功:', res);
          // 上传成功后，清空输入框
          this.setData({
            inputValue: ''
          });
          // 重新加载评论列表
          this.loadComments();
        },
        fail: err => {
          console.error('评论上传失败:', err);
        }
      });
    } else {
      console.log('评论内容不能为空');
    }
  },

  loadComments: async function () {
    try {
      const res = await wx.cloud.callFunction({
        name: 'loadComments',
        data: {
          id: this.data.id
        }
      });
  
      const comments = res.result.map(comment => {
        // 处理评论和回复的用户信息
        const userInfo = comment.userInfo[0] || {};
        comment.avatarUrl = userInfo.avatarUrl || '';
        comment.nickname = userInfo.nickName || '';
  
        // 格式化评论的创建时间
        if (comment.createTime) {
          comment.createTime = this.formatDate(comment.createTime);
        }
  
        comment.replies = comment.replies.map(reply => {
          const replyUserInfo = comment.replyUserInfo.find(user => user._openid === reply._openid) || {};
          
          // 格式化回复的创建时间
          if (reply.createTime) {
            reply.createTime = this.formatDate(reply.createTime);
          }
  
          return {
            ...reply,
            avatarUrl: replyUserInfo.avatarUrl || '',
            nickname: replyUserInfo.nickName || ''
          };
        });
  
        return comment;
      });
  
      this.setData({
        comments: comments
      });
    } catch (err) {
      console.error('加载评论失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },
  
  // 新增一个格式化日期的函数
  formatDate: function(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2); // 月份从0开始，所以要加1
    const day = ('0' + d.getDate()).slice(-2);
    const hours = ('0' + d.getHours()).slice(-2);
    const minutes = ('0' + d.getMinutes()).slice(-2);
    const seconds = ('0' + d.getSeconds()).slice(-2);
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },
  
  
  onShow: function() {
    this.loadComments();
  },

  selectRight: function(e) {
    if (!app.checkLogin()) {
      return; 
    }
    let score = e.currentTarget.dataset.score;
    console.log(score,e.currentTarget.dataset.score)
    let id = this.data.id;
    this.setData({
      select: score
    });
    app.saveRating(score, id);
  },

  onLoad: function(options) {
    const id = options.id;
    const name = options.name;
    const image = options.image;
    this.setData({
      id: id,
      name: name,
      image:image,
      user_openid:app.globalData.status
    });
    this.reset(id);
    this.queryRating(id);
    console.log(this.data.user_openid)
  },

  queryRating: function(id) {
    const db = wx.cloud.database();
    const app = getApp();
    const openid = app.globalData.status;
    
    db.collection('ratings')
      .where({
        _openid: openid,
        id: id
      })
      .get({
        success: res => {
          if (res.data.length > 0) {
            this.setData({
              select: res.data[0].score
            });
          } else {
            this.setData({
              select: 0
            });
          }
        },
        fail: err => {
          console.error('查询评分失败', err);
          this.setData({
            select: 0
          });
        }
      });
  },

  reset: function(id) {
    const db = wx.cloud.database();
    db.collection("part_item").doc(id).get({
      success: partItemRes => {
        if (partItemRes.data) {
          let sum = partItemRes.data.sum; 
          console.log("数量",sum)
          let count = 0; 
          db.collection("ratings")
            .where({
              id: id
            })
            .get({
              success: ratingsRes => {
                if (ratingsRes.data.length > 0) {
                  console.log("数量",ratingsRes.data.length)
                  ratingsRes.data.forEach(rating => {
                    count += rating.score;
                  });
                  const averageRating = count / ratingsRes.data.length;
                  db.collection("part_item").doc(id).update({
                    data:{
                      sum:ratingsRes.data.length,
                      rating:averageRating
                    }
                  })
                  this.setData({
                    rating: averageRating.toFixed(1)*2,
                    sum: ratingsRes.data.length 
                  });
                } else {
                  this.setData({
                    rating: 0,
                    sum: 0
                  });
                }
              },
              fail: err => {
                console.error('查询ratings集合失败', err);
              }
            });
        }
      },
      fail: err => {
        console.error('查询part_item集合失败', err);
      }
    });
  },

  onCommentTap: function(e) {
    if (!app.checkLogin()) {
      return; 
    }
    const that=this
    const commentId = e.currentTarget.dataset.id; 
    wx.showModal({
      title: '回复评论',
      editable: true,
      content: '',
      placeholderText: '请输入你的回复',
      success: function(res) {
        if (res.confirm) {
          const replyContent = res.content;
          const db=wx.cloud.database();
          const replyObject = {
            content: replyContent,
            createTime: db.serverDate(),
            id: commentId,
          };
          db.collection('replies').add({
            data: replyObject,
            success: function(res) {
              console.log('用户点击确定，回复评论:', replyContent);
              console.log('回复添加成功', res);
            },
            fail: function(err) {
              console.error('回复添加失败', err);
            }
          });
        }
        that.loadComments()
        that.setData({
          reply:res.content
       })
      }
    });
    this.loadComments()
  },
  onDeleteComment: function(e) {
    const commentId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '您确定要删除这条评论吗？',
      success: res => {
        if (res.confirm) {
          const db=wx.cloud.database()
          db.collection("comments").where({
            _id:commentId
          }).remove()
          this.loadComments()
        } else if (res.cancel) {
            console.log('用户点击了取消');
          }
      }
    });
  },
  onDeleteReply: function(e) {
    const replyId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '您确定要删除这条回复吗？',
      success: res => {
        if (res.confirm) {
          this.deleteReply(replyId);
        } else if (res.cancel) {
          console.log('用户点击了取消');
        }
      }
    });
  },

  deleteReply: function(replyId) {
    const db=wx.cloud.database()
    db.collection("replies").where({
      _id:replyId
    }).remove()
    this.loadComments()
  }
  
});