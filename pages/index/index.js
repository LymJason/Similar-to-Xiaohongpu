Page({

  data: {
    partList: [],
    popPartList: []
  },

  onShow(){
    wx.cloud.callFunction({
      name: 'fetchParts', 
      success: res => {
        if (res.result.success) {
          this.setData({
            partList: res.result.data
          });
        } else {
          console.error('调用云函数失败', res.result.error);
        }
      },
      fail: err => {
        console.error('调用云函数失败', err);
      }
    });
    this.fetchPopPartData();
  },

  onLoad(options) {
    
  },
 
  queryPartItems: function(partName) {
    const db = wx.cloud.database();
    const partItemCollection = db.collection('part_item');
    return partItemCollection
      .where({
        part: partName
      })
      .limit(3)
      .get();
  },
  
  fetchPopPartData: function() {
    const db = wx.cloud.database();
    const partCollection = db.collection('part');
    partCollection
      .orderBy('num', 'desc')
      .limit(5)
      .get({
        success: res => {
          const parts = res.data;
          let popPartList = [];
          const processParts = (index) => {
            if (index >= parts.length) {
              this.setData({ popPartList });
              return;
            }
            const part = parts[index];
            this.queryPartItems(part.name).then(partItemsRes => {
              const partWithItems = {
                ...part,
                partItems: partItemsRes.data.map(item => ({
                  name: item.name,
                  image: item.image,
                  _id:item._id
                }))
              };
              popPartList.push(partWithItems);
              processParts(index + 1);
            }).catch(err => {
              console.error('查询 part_item 失败', err);
            });
          };
          processParts(0);
        },
        fail: err => {
          console.error('查询 part 失败', err);
        }
      });
  },

  onPopPartTap: function(event) {
    const itemId = event.currentTarget.dataset.id;
    const itemName = event.currentTarget.dataset.name;
    const itemImage = event.currentTarget.dataset.image?event.currentTarget.dataset.image:'/images/add.png';
    const params = `?id=${itemId}&name=${itemName}&image=${itemImage}`;
    wx.navigateTo({
      url: `/pages/detail/detail${params}`
    });
  },

  onPartItemTap: function(event) {
    const partItemName = event.currentTarget.dataset.name; 
    console.log('name:', partItemName);
    wx.navigateTo({
      url: `/pages/part/part?partItemName=${partItemName}`,
      success: function(res) {
      },
      fail: function(error) {
        console.error('打开页面失败：', error);
      }
    });
  },

  goToAdd:function(){
    wx.navigateTo({
      url: '/pages/add/add',
    })
  }
})