const app = getApp();

Page({
  data: {
    imagePath: '',
    imageFileID: '',
    name: '',
    describe: ''
  },

  onShow: function (options) {
    app.checkLogin();
  },

  chooseMedia: function () {
    const that = this;
    wx.chooseMedia({
      count: 1,
      sourceType: ['album', 'camera'],
      success: function (res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        that.setData({
          imagePath: tempFilePath
        });
        that.uploadImageToCloud(tempFilePath);
      }
    });
  },

  uploadImageToCloud: function (filePath) {
    const that = this;
    wx.cloud.uploadFile({
      cloudPath: 'blog_images/' + new Date().getTime() + '.jpg',
      filePath: filePath,
      success: res => {
        that.setData({
          imageFileID: res.fileID
        });
      },
      fail: err => {
        console.error(err);
        wx.showToast({
          title: '图片上传失败',
          icon: 'none'
        });
      }
    });
  },

  onFormSubmit: function (e) {
    console.log('表单提交事件触发'); // 日志
    const { name, describe } = e.detail.value;
    const db = wx.cloud.database();
    if (!name) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      });
      return;
    }
    const description = describe || '';
    db.collection('blog').add({
      data: {
        image: this.data.imageFileID,
        name: name,
        describe: description,
        createTime: new Date()
      },
      success: res => {
        console.log('发布成功，返回的数据:', res); // 日志
        wx.showToast({
          title: '发布成功',
          icon: 'success'
        });

        // 清空表单
        this.setData({
          imagePath: '',
          imageFileID: '',
          name: '',
          describe: ''
        });

        // 跳转到 historyblog 页面
        console.log('准备跳转到 historyblog 页面'); // 日志
        wx.navigateTo({
          url: '/pages/historyblog/historyblog'
        });
        console.log('跳转完成'); // 日志
      },
      fail: err => {
        console.error('发布失败:', err); // 日志
        wx.showToast({
          title: '发布失败',
          icon: 'none'
        });
        if (this.data.imageFileID) {
          wx.cloud.deleteFile({
            fileList: [this.data.imageFileID],
            success: delRes => {
              console.log('已删除失败上传的图片:', delRes);
            },
            fail: delErr => {
              console.error('删除图片失败:', delErr);
            }
          });
        }
      }
    });
  }
});