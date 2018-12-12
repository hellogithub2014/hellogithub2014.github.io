(function() {
    for (var i = 0; i < CRM_PRE_CACHE_PATH_LIST.length; i++) {
        preCache(CRM_PRE_CACHE_PATH_LIST[i]);
    }

    /**
     * 预缓存外部应用的一些关键静态资源
     *
     * @author  刘斌
     * @param {string} nginxPath 外部应用的nginx代理路径
     */
    function preCache(nginxPath) {
        var lc = window.location;
        var manifestUrl = lc.protocol + "//" + lc.host + "/" + nginxPath + "/pre-cache-manifest.json";

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                    console.log('获取清单文件成功: ' + manifestUrl);
                    // 清单文件中的files属性，表明所有想预缓存的文件。
                    preCacheStaticFiles(nginxPath, JSON.parse(xhr.responseText).pathList);
                } else {
                    console.error('获取清单文件失败: ' + manifestUrl);
                }
            }
        };
        xhr.open('get', manifestUrl, true);
        xhr.send(null);
    }

    /**
     * 请求文件清单中的所有文件。
     * 这些文件应该设成永久缓存的，不然每次还是要额外发送请求
     *
     * @author  刘斌
     *
     * @param {string} nginxPath 外部应用的nginx代理路径
     * @param {string[]} pathList 文件路径列表，均为相对路径
     */
    function preCacheStaticFiles(nginxPath, fileShortPathList) {
        for (var i = 0; i < fileShortPathList.length; i++) {
            var lc = window.location;
            var wholeUrl = lc.protocol + "//" + lc.host + "/" + nginxPath + "/" + fileShortPathList[i];
            preCacheFile(wholeUrl);
        }
    }

    /**
     * 请求单个文件
     *
     * @author  刘斌
     * @param {string} fileUrl
     */
    function preCacheFile(fileUrl) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                    console.log('获取文件成功: ' + fileUrl);
                } else {
                    console.error('获取文件失败: ' + fileUrl);
                }
            }
        };
        xhr.open('get', fileUrl, true);
        xhr.send(null);
    }
})();