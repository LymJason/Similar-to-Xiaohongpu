const app=getApp();
Page({
  data: {
    imagePath: '',
    imageFileID: '', 
    ratingObjectImagePath: '', 
    ratingObjectImageFileID: '', 
    showRatingObjectForm: false, 
    partItemName: '', // 新增
    ratingObjectName: '' // 新增
  },

  chooseMedia: function() {
    const that = this;
    wx.chooseMedia({
      count: 1, 
      sourceType: ['album', 'camera'], 
      success: function(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        that.setData({
          imagePath: tempFilePath
        });
        that.uploadImageToCloud(tempFilePath);
      }
    });
  },
  
  uploadImageToCloud: function(filePath) {
      const that = this;
      wx.cloud.uploadFile({
        cloudPath: 'images/' + new Date().getTime() + '.jpg', 
        filePath: filePath, 
        success: res => {
          that.setData({
            imageFileID: res.fileID
          });
          resolve(res);
        },
        fail: err => {
          reject(err);
          console.error(err);
        }
      });
  },


  showAddRatingObject: function() {
    this.chooseRatingObjectMedia()
  },

  chooseRatingObjectMedia: function() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      sourceType: ['album', 'camera'],
      success: function(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        that.setData({
          ratingObjectImagePath: tempFilePath,
          showRatingObjectForm: true
        });
        that.uploadRatingObjectImageToCloud(tempFilePath);
      }
    });
  },

  uploadRatingObjectImageToCloud: function(filePath) {
    const that = this;
    wx.cloud.uploadFile({
      cloudPath: 'images/' + new Date().getTime() + '.jpg',
      filePath: filePath,
      success: res => {
        that.setData({
          ratingObjectImageFileID: res.fileID
        });
      },
      fail: err => {
        console.error(err);
      }
    });
    this.setData({
      showRatingObjectForm: true
    });
  },

  onFormSubmit: function(e) {
    const { partItemName, ratingObjectName } = e.detail.value;
    const db = wx.cloud.database();
    const that = this;
  
    // 检查必填字段
    if (!partItemName || !ratingObjectName) {
      wx.showToast({
        title: '请填写所有必填字段',
        icon: 'none'
      });
      return; 
    }
  
    // 添加评分标题到 part 集合
    db.collection('part').add({
      data: {
        image: this.data.imageFileID,
        name: partItemName,
        num: 1
      },
      success: function(res) {
        // 添加评分对象到 part_item 集合
        db.collection('part_item').add({
          data: {
            name: ratingObjectName,
            image: that.data.ratingObjectImageFileID,
            part: partItemName,
            rating: 0,
            sum: 0
          },
          success: function(res) {
            wx.showToast({
              title: '添加成功',
              icon: 'success'
            });
  
            // 清空表单数据和图片
            that.setData({
              imagePath: '', // 清空图片路径
              imageFileID: '', // 清空图片文件 ID
              ratingObjectImagePath: '', // 清空评分对象图片路径
              ratingObjectImageFileID: '', // 清空评分对象图片文件 ID
              showRatingObjectForm: false, // 隐藏评分对象表单
              partItemName: '', // 清空评分标题输入框
              ratingObjectName: '' // 清空评分对象输入框
            });
          },
          fail: function(err) {
            console.error(err);
            wx.showToast({
              title: '添加失败',
              icon: 'none'
            });
  
            // 删除已上传的图片
            wx.cloud.deleteFile({
              fileList: [that.data.imageFileID, that.data.ratingObjectImageFileID],
              success: res => {
                console.log('删除图片成功:', res);
              },
              fail: err => {
                console.error('删除图片失败:', err);
              }
            });
          }
        });
      },
      fail: function(err) {
        console.error(err);
        wx.showToast({
          title: '添加失败',
          icon: 'none'
        });
  
        // 删除已上传的图片
        wx.cloud.deleteFile({
          fileList: [that.data.imageFileID, that.data.ratingObjectImageFileID],
          success: res => {
            console.log('删除图片成功:', res);
          },
          fail: err => {
            console.error('删除图片失败:', err);
          }
        });
      }
    });
  },

  onShow: function(options){
    app.checkLogin();
  }
});
