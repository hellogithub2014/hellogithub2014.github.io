/**
 * 用于生成pre-cache-manifest.json的配置
 */
module.exports = [{
    folder: "build", // www下的文件夹名
    contentIdentifiers: [ // 需要根据内容唯一标志符来查找的文件,此处填写正则表达式
        /\bWanttosayModuleNgFactory\b/, // 懒加载生成的模块js,Module名+ NgFactory
    ],
    fixedNames: [ // 固定名字的文件
        "polyfills.js"
    ],
    fixedNameRules: [ // 名称为固定格式的文件,此处填写正则表达式
        /^main\.[^.]+\.js$/,
        /^vendor\.[^.]+\.js$/,
    ],
    withVersions: [ // 文件名在index.html中加了版本号
        { fileName: "main.css", algorithm: "random" }, // algorithm:版本号算法，"random"、"md5"
    ]
}, {
    folder: "", // 表示www本身
    withVersions: [
        { fileName: "3rdPartyLib.min.js", algorithm: "md5" },
    ]
}];