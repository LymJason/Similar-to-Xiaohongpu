const app = getApp();

Page({
  data: {
    blogs: [] // 当前用户发布的博客列表
  },

  onLoad: function () {
    this.loadBlogs();
  },

  // 加载当前用户发布的博客
  loadBlogs: function () {
    const db = wx.cloud.database();
    const _ = db.command;
    const user_openid = app.globalData.user_openid; // 当前用户的 openid

    db.collection('blog')
      .where({
        _openid: user_openid // 根据用户的 openid 查询博客
      })
      .orderBy('createTime', 'desc') // 按发布时间倒序排列
      .get()
      .then(res => {
        const blogs = res.data.map(blog => {
          blog.createTime = this.formatTime(blog.createTime); // 格式化时间
          return blog;
        });
        this.setData({
          blogs: blogs
        });
      })
      .catch(err => {
        console.error('加载博客失败:', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  // 格式化时间
  formatTime: function (date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
  },

  // 点击博客项
  goToDetail: function (e) {
    const { describe, id, name, image, _openid } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/blogdetail/blogdetail?describe=${describe}&id=${id}&name=${name}&image=${image}&_openid=${_openid}`
    });
  },

  // 删除博客
  onDeleteBlog: function (e) {
    const blogId = e.currentTarget.dataset.id; // 获取博客的 _id
    const that = this;

    wx.showModal({
      title: '确认删除',
      content: '您确定要删除这条博客吗？',
      success(res) {
        if (res.confirm) {
          const db = wx.cloud.database();
          db.collection('blog')
            .doc(blogId)
            .remove()
            .then(() => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              // 重新加载博客列表
              that.loadBlogs();
            })
            .catch(err => {
              console.error('删除失败:', err);
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            });
        }
      }
    });
  }
});