//blogdetail
const app=getApp()
Page({
  data: {
    id: null, 
    name: '',
    describe: '',
    sum: '',
    image:'',
    comments: [],
    imageFileID:'',
    imagePath:'',
    user_openid:'',
    reply:""
  },

  onImageTap: function() {
    wx.previewImage({
      current: this.data.image, 
      urls: [this.data.image] 
    });
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
    db.collection('blog').doc(this.data.id).update({
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
          this.setData({
            inputValue: ''
          });
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

  onLoad: function(options) { 
    this.setData({
      describe:options.describe,
      id: options.id,
      _openid:options._openid,
      name:options.name,
      image:options.image,
      user_openid:app.globalData.user_openid
    });
    this.loaduser()
    console.log(this.data.user_openid)
  },

  loaduser:function(){
    const db = wx.cloud.database();
    db.collection("userInfo").where({
      _openid: this.data._openid
    }).get().then(res => {
    this.setData({
      avatarUrl: res.data[0].avatarUrl,
      nickName: res.data[0].nickName
    });
      console.log(this.data.avatarUrl)
    })
  },
  
  onPullDownRefresh(){
    this.loadComments()
    wx.stopPullDownRefresh()
  },

  onCommentTap: function(e) {
    const that=this
    if (!app.checkLogin()) {
      return; 
    }
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