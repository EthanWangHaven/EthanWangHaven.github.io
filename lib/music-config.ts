export interface LyricLine {
  time: number // seconds
  text: string
}

export interface Song {
  id: string
  title: string
  artist: string
  audioUrl: string
  lyrics: LyricLine[]
}

function neteaseUrl(id: string) {
  return `https://music.163.com/song/media/outer/url?id=${id}.mp3`
}

export const playlist: Song[] = [
  {
    id: "2707652860",
    title: "半句再见",
    artist: "孙燕姿",
    audioUrl: "/audio/banjuzaijian.mp3",
    lyrics: [
      { time: 0, text: "半句再见 - 孙燕姿" },
      { time: 5, text: "词：徐佳莹" },
      { time: 9, text: "曲：徐佳莹" },
      { time: 14, text: "" },
      { time: 17, text: "还记得那年夏天" },
      { time: 21, text: "你说你要走" },
      { time: 25, text: "我站在车站里" },
      { time: 29, text: "看着你的背影" },
      { time: 33, text: "" },
      { time: 36, text: "半句再见" },
      { time: 40, text: "说不出口的眷恋" },
      { time: 44, text: "你微笑着挥挥手" },
      { time: 48, text: "转身消失在人海中" },
      { time: 52, text: "" },
      { time: 55, text: "如果当时勇敢一点" },
      { time: 59, text: "如果当时执着一点" },
      { time: 63, text: "是不是故事结局" },
      { time: 67, text: "会有不同的终点" },
      { time: 71, text: "" },
      { time: 74, text: "半句再见" },
      { time: 78, text: "藏在心里多少年" },
      { time: 82, text: "偶尔想起你的脸" },
      { time: 86, text: "依然会红了眼" },
      { time: 90, text: "" },
      { time: 93, text: "时间走得好远" },
      { time: 97, text: "我们都在改变" },
      { time: 101, text: "只是那句没说完的再见" },
      { time: 105, text: "还在心里盘旋" },
      { time: 110, text: "" },
      { time: 113, text: "半句再见" },
      { time: 117, text: "成了永远的遗憾" },
      { time: 121, text: "愿你过得好" },
      { time: 125, text: "在没有我的世界" },
      { time: 130, text: "" },
      { time: 133, text: "（间奏）" },
      { time: 160, text: "" },
      { time: 165, text: "还记得那个夏天" },
      { time: 169, text: "那句没说完的再见" },
      { time: 175, text: "半句再见" },
    ],
  },
]
