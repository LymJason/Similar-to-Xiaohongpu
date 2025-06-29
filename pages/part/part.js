Page({
  data: {
    partItemList: [] // 初始化某专区的列表
  },

  onLoad: function(options) {
    const partItemName = options.partItemName; // 获取URL参数中的部分名称
    this.setData({
      partItemName:options.partItemName
    })
    wx.cloud.callFunction({
      name: 'getPartItem',
      data: {
        partItemName: partItemName
      },
      success: res => {
        const updatedPartItemList = res.result.data.map(item => {
          return {
            ...item,
            rating: parseFloat(item.rating.toFixed(1))*2 
          };
        });
        this.setData({
          partItemList: updatedPartItemList
        });
      },
      fail: err => {
        wx.showToast({
          title: '查询部分信息失败',
          icon: 'none'
        });
        console.error('查询部分信息失败：', err);
      }
    })
  },

  onPartItemTap: function(event) {
    const itemId = event.currentTarget.dataset.id;
    const itemName = event.currentTarget.dataset.name;
    const itemImage = event.currentTarget.dataset.image?event.currentTarget.dataset.image:'/images/add.png';
    const params = `?id=${itemId}&name=${itemName}&image=${itemImage}`;
    wx.navigateTo({
      url: `/pages/detail/detail${params}`
    });
  },
  onAddRatingObjectTap: function() {
    const partItemName= this.data.partItemName;
    console.log(partItemName);
    wx.navigateTo({
      url: '/pages/addRatingObject/addRatingObject?partItemName='+partItemName
    });
  },
  onShow(){
    wx.cloud.callFunction({
      name: 'getPartItem',
      data: {
        partItemName: this.data.partItemName 
      },
      success: res => {
        const updatedPartItemList = res.result.data.map(item => {
          return {
            ...item, 
            rating: parseFloat(item.rating.toFixed(1))*2 
          };
        });
        this.setData({
          partItemList: updatedPartItemList
        });
      },
      fail: err => {
        wx.showToast({
          title: '查询部分信息失败',
          icon: 'none'
        });
        console.error('查询部分信息失败：', err);
      }
    })
  }
})
