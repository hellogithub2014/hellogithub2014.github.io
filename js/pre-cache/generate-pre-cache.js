/**
 * 用于生成pre-cache-manifest.json
 * 此文件用来告诉其他应用，如果想预缓存本应用，应该缓存哪些文件。
 */
var patternList = require("./generate-pre-cache.config");
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var cheerio = require('cheerio');

/**
 * 入口函数
 *
 * @author  刘斌
 */
function generate() {
    let pathList = [];

    // 获取符合每个模式的所有文件路径
    for (let pattern of patternList) {
        pathList = pathList.concat(searchByPattern(pattern));
    }

    generateManifest(pathList); // 生成清单文件
}

/**
 * 查找符合每一个模式的所有文件。
 * 这些文件应当全部处于www文件夹下
 *
 * @author  刘斌
 * @param {{folder:string,contentIdentifiers?:RegExp[],fixedNames?:string[],fixedNameRules?:RegExp[],withVersions?:{ fileName: string, algorithm: string }}} pattern
 * @returns
 */
function searchByPattern(pattern) {
    let result = [];
    let curFolderPath = path.join(__dirname, "./www", pattern.folder);

    const pathGenerator = (folder, fileName) => { // 文件路径拼接工具方法
        if (folder.trim() !== "") {
            return `${folder}/${fileName}`;
        }
        return `${fileName}`;
    };

    result = result.concat(pattern.fixedNames || []); // 固定名称的文件

    const folderFiles = fs.readdirSync(curFolderPath); // 当前路径下的所有文件，包括文件夹的名字

    result = result.concat(folderFiles.filter(fileName => { // 文件名满足固定格式，或者文件内容匹配特定标识符的搜索文件
        return isMatchNameRule(fileName, pattern.fixedNameRules, pattern) ||
            isMatchContentIdentifier(fileName, pattern.contentIdentifiers, pattern);
    }));

    result = result.concat(filesAddedVersions(pattern.withVersions, pattern)); // 文件名在index.html后面有版本号的所有文件

    return result.map(fileName => pathGenerator(pattern.folder, fileName));
}

/**
 * 查找某个模式下，文件名在index.html后面有版本号的所有文件
 *
 * @author  刘斌
 * @param {{ fileName: string, algorithm: string }[]} withVersions
 * @param {{folder:string,contentIdentifiers?:RegExp[],fixedNames?:string[],fixedNameRules?:RegExp[],withVersions?:{ fileName: string, algorithm: string }}} pattern
 * @returns
 */
function filesAddedVersions(withVersions, pattern) {
    if (!withVersions || withVersions.length === 0) {
        return false;
    }

    const versionAlgorithms = {
        random: randomVersion,
        md5: md5Version
    };

    let result = [];
    for (let versionConfig of withVersions) {
        let algorithm = "random";
        if (versionConfig.algorithm && (versionConfig.algorithm in versionAlgorithms)) {
            algorithm = versionConfig.algorithm;
        }
        result.push(versionConfig.fileName + versionAlgorithms[algorithm](versionConfig.fileName, pattern));
    }
    return result;
}

/**
 * 文件在index.html中版本号是随机数的，探测index.html，来获取他们的版本号
 *
 * @author  刘斌
 * @param {string} fileName
 * @param {{folder:string,contentIdentifiers?:RegExp[],fixedNames?:string[],fixedNameRules?:RegExp[],withVersions?:{ fileName: string, algorithm: string }}} pattern
 * @returns 如果成功，返回类似 ?v=123  的字符串，失败时返回空串
 */
function randomVersion(fileName, pattern) {
    let version = "";
    var indexHtmlPath = path.join(__dirname, 'www', 'index.html');
    var indexHtmlContent = fs.readFileSync(indexHtmlPath, {
        encoding: 'utf8'
    });
    var $ = cheerio.load(indexHtmlContent);

    const attr = $(`[src^="${pattern.folder}/${fileName}"]`).attr('src') || $(`[href^="${pattern.folder}/${fileName}"]`).attr('href');

    let index;
    if (attr && attr.trim().length > 0 && (index = attr.indexOf("?")) > 0) {
        version = attr.slice(index); // 返回问号之后的例如 v=123
    }

    return version;
}


/**
 * 文件在index.html中版本号是它们的MD5，直接计算得出即可。
 *
 * @author  刘斌
 * @param {string} fileName
 * @param {{folder:string,contentIdentifiers?:RegExp[],fixedNames?:string[],fixedNameRules?:RegExp[],withVersions?:{ fileName: string, algorithm: string }}} pattern
 * @returns 如果成功，返回类似 ?v=123  的字符串，失败时返回空串
 */
function md5Version(fileName, pattern) {
    let version = "";
    try {
        var fileContent = fs.readFileSync(path.join(__dirname, "./www", pattern.folder, fileName), 'utf8');
        var md5 = crypto.createHash('md5');
        md5.update(fileContent); // 基于压缩后的js内容生成hash
        var hash = md5.digest('hex');
        version = `?v=${hash}`;
    } catch (e) {
        console.error(`error happened in md5Version, error: `, e, `, fileName = ${fileName}, pattern = `, pattern);
        version = ""
    }
    return version;
}

/**
 * 当前文件名是否匹配相对应的的任一文件名规则
 *
 * @author  刘斌
 * @param {string} fileName
 * @param {RegExp[]} nameRules
 * @param {{folder:string,contentIdentifiers?:RegExp[],fixedNames?:string[],fixedNameRules?:RegExp[],withVersions?:{ fileName: string, algorithm: string }}} pattern
 * @returns 成功返回true，失败返回false
 */
function isMatchNameRule(fileName, nameRules, pattern) {
    if (!nameRules || nameRules.length === 0) {
        return false;
    }

    return nameRules.some(nameRegExp => nameRegExp.test(fileName));
}

/**
 * 当前文件的内容是否匹配相对应的的任一标识符规则
 *
 * @author  刘斌
 * @param {string} fileName
 * @param {RegExp[]} identifiers
 * @param {{folder:string,contentIdentifiers?:RegExp[],fixedNames?:string[],fixedNameRules?:RegExp[],withVersions?:{ fileName: string, algorithm: string }}} pattern
 * @returns 成功返回true，失败返回false
 */
function isMatchContentIdentifier(fileName, identifiers, pattern) {
    if (!identifiers || identifiers.length === 0) {
        return false;
    }

    let result = false;
    try {
        const fileContent = fs.readFileSync(path.join(__dirname, "./www", pattern.folder, fileName), 'utf8');
        result = identifiers.some(identifier => identifier.test(fileContent));
    } catch (e) {
        console.error(`error happened in isMatchContentIdentifier, error: `, e,
            `, fileName = ${fileName}, identifiers = `, identifiers);
        result = false;
    }
    return result;
}

/**
 * 生成清单文件
 *
 * @author  刘斌
 * @param {any} pathList
 */
function generateManifest(pathList) {
    fs.writeFile(
        path.join(__dirname, "./www/pre-cache-manifest.json"),
        JSON.stringify({
            pathList
        }),
        'utf8',
        function(error) {
            if (error) {
                console.error(`Error while generate-pre-cache: `, error);
            } else {
                console.log("Success while generate-pre-cache");
            }
        });
}

generate();