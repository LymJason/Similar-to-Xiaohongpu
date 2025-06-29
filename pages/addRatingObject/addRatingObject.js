const db = wx.cloud.database();
const _ = db.command;
const app = getApp();

Page({
  data: {
    partItemName: '', // 评分标题
    imagePath: '', // 图片路径
    imageFileID: '', // 图片文件 ID
    ratingObjectName: '' // 评分对象名称
  },

  // 选择图片
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
        that.uploadImageToCloud(tempFilePath); // 上传图片到云存储
      }
    });
  },

  // 上传图片到云存储
  uploadImageToCloud: function(filePath) {
    const that = this;
    wx.cloud.uploadFile({
      cloudPath: 'images/' + new Date().getTime() + '.jpg',
      filePath: filePath, 
      success: res => {
        that.setData({
          imageFileID: res.fileID // 保存图片文件 ID
        });
      },
      fail: err => {
        console.error(err);
      }
    });
  },

  // 表单提交
  onFormSubmit: function(e) {
    const { name } = e.detail.value;
    const db = wx.cloud.database();
    const _ = db.command;

    // 更新 part 集合中的 num 字段
    db.collection('part').where({
      name: this.data.partItemName
    }).update({
      data: {
        num: _.inc(1) // num 字段自增 1
      }
    }).then(() => {
      // 添加评分对象到 part_item 集合
      return db.collection('part_item').add({
        data: {
          name: name,
          part: this.data.partItemName,
          image: this.data.imageFileID,
          rating: 0,
          sum: 0
        }
      });
    }).then(() => {
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      });

      // 清空表单数据
      this.setData({
        imagePath: '', // 清空图片路径
        imageFileID: '', // 清空图片文件 ID
        ratingObjectName: '' // 清空评分对象名称
      });
    }).catch((err) => {
      console.error(err);
      wx.showToast({
        title: '添加失败，正在删除图片...',
        icon: 'none'
      });

      // 删除已上传的图片
      wx.cloud.deleteFile({
        fileList: [this.data.imageFileID],
        success: res => {
          console.log('删除图片成功:', res);
        },
        fail: err => {
          console.error('删除图片失败:', err);
        }
      });
    });
  },

  // 页面加载时初始化数据
  onLoad: function(options) {
    this.setData({
      partItemName: options.partItemName // 从上一个页面传递过来的评分标题
    });
  },

  // 页面显示时重新加载数据
  onShow: function() {
    app.checkLogin(); // 检查登录状态
    this.resetPageData(); // 清空页面数据
  },

  // 清空页面数据
  resetPageData: function() {
    this.setData({
      imagePath: '', // 清空图片路径
      imageFileID: '', // 清空图片文件 ID
      ratingObjectName: '' // 清空评分对象名称
    });
  },
});