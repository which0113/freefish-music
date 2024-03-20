// 播放音乐的上下文
const innerAudioContext = wx.createInnerAudioContext({
  useWebAudioImplement: false
});

// 歌单播放量格式化
function formatCount(count) {
  count = Number(count);
  if (count >= 100000000) {
    return (count / 100000000).toFixed(1) + "亿";
  } else if (count >= 10000) {
    return (count / 10000).toFixed(1) + "万";
  } else {
    return count;
  }
}

Page({
  data: {
    active: 1,
    show: false,
    buttonStates: [], // 歌曲播放状态
    popupPicture: "", // 歌曲播放界面图片
    lunbo: [], // 轮播图
    musicTJ: [], // 推荐歌曲 
    veryMusicList: [], // 精品歌单
    musicPHB: [], // 排行榜
    hotDJ: [], // 热门电台
    index: "", // 歌曲索引
    index_temp: -1,
    play: "/static/music/play.png",
    pause: "/static/music/pause.png",
    tagList: ["猜你喜欢", "SQ", "100万"],
    currentLyricText: "", // 当前进行的某句歌词
    durationTime: 0, // 音乐时长
    currentTime: 0, // 当前播放完成时间
    sliderValue: 0, // 播放进度（百分比）
    musicId: "", //歌曲Id
  },
  onLoad: function () {

    // 监听音频播放结束事件
    innerAudioContext.onEnded(() => {
      this.on_B();
    });
    // 获取轮播图
    wx.request({
      url: 'http://www.codeman.ink/api/banner?type=0',
      success: function (res) {
        this.setData({
          lunbo: res.data.banners.slice(0, 3)
        });
      }.bind(this) // 使用bind将this绑定到回调函数内部
    });
    // 获取推荐歌曲信息
    wx.request({
      url: 'http://www.codeman.ink/api/personalized/newsong?limit=3',
      success: function (res) {
        const self = this; // 保存 this 的引用
        this.setData({
          musicTJ: res.data.result
        });
        const preMusicUrl = "http://www.codeman.ink/api/song/url/v1?id=";
        const _musicTJ = this.data.musicTJ.map((item, index) => {
          item.type = index;
          // 获取mp3Url
          const requestUrl = preMusicUrl + item.id + "&level=standard";
          // console.log(item.id);
          wx.request({
            url: requestUrl,
            success: (res2) => {
              const musicUrl = res2.data.data[0].url;
              // console.log("url: " + musicUrl);
              self.setData({
                ['musicTJ[' + index + '].song.mp3Url']: musicUrl
              });
            }
          });
          return item;
        });
        this.setData({
          musicTJ: _musicTJ,
          buttonStates: _musicTJ
        });
      }.bind(this)
    });
    // 初始化歌曲播放状态
    var _buttonStates = this.data.buttonStates;
    for (let i = 0; i < _buttonStates.length; i++) {
      _buttonStates[i] = true;
    }
    this.setData({
      buttonStates: _buttonStates
    });
    // 获取精品歌单信息
    wx.request({
      url: ' http://www.codeman.ink/api/top/playlist/highquality?limit=6',
      success: function (res) {
        //  console.log(res);
        // 更新数据到页面
        this.setData({
          veryMusicList: res.data.playlists
        });
      }.bind(this) // 使用bind将this绑定到回调函数内部
    });
    //获取排行榜数据
    wx.request({
      url: "http://www.codeman.ink/api/toplist/detail",
      success: (res) => {
        //  console.log(res.data.list);
        // 截取第1-3条数据---slice(起始索引,截取个数)---- 数组截取函数
        let item = res.data.list.slice(0, 3);
        //  console.log(item);
        this.setData({
          musicPHB: item,
        });
      },
    });
    // 获取热门电台
    wx.request({
      url: 'http://www.codeman.ink/api/dj/hot?limit=6',
      success: function (res) {
        this.setData({
          hotDJ: res.data.djRadios
        });
      }.bind(this) // 使用bind将this绑定到回调函数内部
    });
  },
  // 弹窗歌曲播放界面
  showPopup: function (e) {
    const _index = e.currentTarget.dataset.index;
    this.setData({
      index: _index,
      popupPicture: this.data.musicTJ[_index].picUrl,
      show: true
    });
    // console.log(this.data.popupPicture);
  },
  // 关闭歌曲播放界面
  onClose() {
    this.setData({
      show: false
    });
  },
  // 歌曲的播放和暂停
  onButtonTap: function (e) {
    //  console.log("onButtonTap => " + e);
    const _index = e.currentTarget.dataset.index;
    innerAudioContext.src = this.data.musicTJ[_index].song.mp3Url;
    // console.log(innerAudioContext.src);
    const _buttonStates = this.data.buttonStates.slice();
    // 用于判断播放的音乐是否为同一首
    if (this.data.index_temp != _index) {
      // 停止
      innerAudioContext.stop();
      this.setData({
        index_temp: _index
      });
    }
    // 如果点击的图标为play
    if (_buttonStates[_index]) {
      for (let i = 0; i < _buttonStates.length; i++) {
        _buttonStates[i] = true;
      }
      _buttonStates[_index] = false;
      this.setData({
        popupPicture: this.data.musicTJ[_index].picUrl,
        show: true
      });
      //  console.log("play");
      innerAudioContext.play(); // 播放
    } else {
      // 如果点击的图标为pause    
      //  console.log("pause");
      innerAudioContext.pause(); // 暂停
      _buttonStates[_index] = true;
    }
    this.setData({
      index: _index,
      buttonStates: _buttonStates
    });
    //  console.log(_index);
  },
  // 下一首
  on_B() {
    //  console.log("下一首");

    var _index = this.data.index;
    //  console.log(this.data.buttonStates.length);
    _index = (_index + 1) % this.data.buttonStates.length;

    // 切换为下一首歌曲
    this.skipMusic(_index);
  },
  // 上一首
  on_F() {
    //  console.log("上一首");

    var _index = this.data.index;
    //  console.log(this.data.buttonStates.length);
    const length = this.data.buttonStates.length
    // _index可能为0，需要加一个周期：length
    _index = (_index + length - 1) % length;

    // 切换为上一首歌曲
    this.skipMusic(_index);
  },
  // 切歌
  skipMusic(_index) {
    const _buttonStates = this.data.buttonStates.slice();
    // 只能有同时存在一首音乐：buttonStates[_index] => false
    for (let i = 0; i < _buttonStates.length; i++) {
      _buttonStates[i] = true;
    }
    _buttonStates[_index] = false;
    this.setData({
      index: _index,
      index_temp: _index,
      popupPicture: this.data.musicTJ[_index].picUrl,
      buttonStates: _buttonStates
    });
    // 停止当前歌曲
    innerAudioContext.stop();
    innerAudioContext.src = this.data.musicTJ[_index].song.mp3Url;
    // 播放
    innerAudioContext.play();
  },
});