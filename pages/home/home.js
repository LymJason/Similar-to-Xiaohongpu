const app = getApp();

Page({
  data: {
    allItems:[],
    items: [],
    left:[],
    itemsInColumns: [[], []]
  },
 
  onLoad: async function() {
    await this.getPartItem(); 
    this.fetchRandomItems();
  },
  
  initWaterfallFlow: function() {
    const items = this.data.items;
    const itemsInColumns = this.data.itemsInColumns;
    items.forEach(item => {
      const shorterColumn = itemsInColumns[0].length <= itemsInColumns[1].length ? 0 : 1;
      itemsInColumns[shorterColumn].push(item);
    });
    this.setData({
      itemsInColumns: itemsInColumns
    });
  },

  onPullDownRefresh(){
    const that = this;
    that.getPartItem();
    that.fetchRandomItems();
    wx.stopPullDownRefresh();
  },

  fetchRandomItems: function() {
    this.setData({
      itemsInColumns: [[], []]
    })
    var left = this.data.allItems.slice(0);
    if (left.length < 12) {
      // 如果left数组的长度小于12，直接将left赋值给items
      this.setData({
        items: left,
        left:[]
      });
    } else {
        const randomItems = left.slice(0).sort(() => Math.random() - 0.5).slice(0, 12);
        // 从left数组中移除randomItems中的条目
        left = left.filter(item => !randomItems.includes(item));
        this.setData({
          items: randomItems,
          left: left.slice(0)
        });
      }
    this.initWaterfallFlow();
    console.log(this.data.itemsInColumns);
  },
  
  onReachBottom: function() {
    wx.showNavigationBarLoading();
    console.log(this.data.itemsInColumns);
    // 获取剩余的left数组长度
    var left = this.data.left.slice(0);
    const itemsInColumns = this.data.itemsInColumns;
    if(left.length > 0) {
      if (left.length < 12) {
        // 如果left数组的长度小于12，直接将left赋值给items
        this.setData({
          items: this.data.items.concat(left),
          left: []
        });
        left.forEach(item => {
          const shorterColumn = itemsInColumns[0].length <= itemsInColumns[1].length ? 0 : 1;
          itemsInColumns[shorterColumn].push(item);
        });
      } else {
        const randomItems = left.slice(0).sort(() => Math.random() - 0.5).slice(0, 12);
        // 从left数组中移除randomItems中的条目
        left = left.filter(item => !randomItems.includes(item));
        this.setData({
          items: this.data.items.concat(randomItems),
          left: left.slice(0)
        });
        randomItems.forEach(item => {
          const shorterColumn = itemsInColumns[0].length <= itemsInColumns[1].length ? 0 : 1;
          itemsInColumns[shorterColumn].push(item);
        });
      }
      console.log(this.data.left);
      console.log(this.data.items);
      console.log(this.data.allItems);     
     
      this.setData({
        itemsInColumns: itemsInColumns
      });
      
    } else {
      wx.showToast({
        title: '已加载全部',
        icon: 'none'
      });
    }
    wx.hideNavigationBarLoading(); 
  },
  

  getPartItem: async function() {
    const db = wx.cloud.database();
    let allItems = []; 
    let hasMoreData = true; 
    let skip = 0; 
    const limit = 20; 
    while (hasMoreData) {
      const res = await db.collection('blog')
        .limit(limit)
        .skip(skip)
        .get();
      allItems = allItems.concat(res.data);
      if (res.data.length < limit) {
        hasMoreData = false;
      } else {
        skip += limit;
      }
    }
    this.setData({
      allItems: allItems
    });
  },

  goToDetail: function(e) {
    const { describe,id, name, image,_openid } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/blogdetail/blogdetail?describe=${describe}&id=${id}&name=${name}&image=${image}&_openid=${_openid}`
    });
  }
});
