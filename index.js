// ==UserScript==
// @name         智慧职教MOOC学院 --网课助手 (蓝版)
// @version      1.08
// @description  智慧职教简易自动学习脚本,解除Ctrl+C限制,自动评论/讨论
// @author        tuChanged
// @run-       document-end
// @grant        unsafeWindow
// @match       *://mooc.icve.com.cn/study/*
// @match       *://zjy2.icve.com.cn/study/*
// @license      GPL
// @namespace https://greasyfork.org/users/449085
// @supportURL https://tuchg.github.io
// @contributionURL https://greasyfork.org/users/449085
// ==/UserScript==
(function () {
    'use strict';
    const setting = {
        // 随机评论
        randomComment: ["6666", "好", "讲解得很精辟", "如听仙乐"],
        //是否启用评论,
        isOpenComment: false,
        //最高延迟
        maxDelayTime: 5000,
        //最低3秒
        minDelayTime: 3000,
        //0-高清 1-清晰 2-流畅 3-原画
        videoQuality: 2,
        //2倍速
        videoPlaybackRate: 2,
        //跳过媒体
        skipVideo: true
    }, _self = unsafeWindow,
        url = location.pathname,
        top = _self

    try {
        while (top != _self.top) top = top.parent.document ? top.parent : _self.top;
    } catch (err) {
        console.log(err);
        top = _self;
    }
    var $ = _self.jQuery || top.jQuery;

    //产生区间随机
    var rnd = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
    /**
     * 随机延迟执行方法
     * @param {需委托执行的函数} func 函数
     */
    var delayExec = (func) => setTimeout(func, rnd(setting.minDelayTime, setting.maxDelayTime));
    //跳转到某小节 通过顶栏
    var gotoUrl = (page) => page.contents()[3].click();
    //跳转下一页
    // var nextCourse = () => $(".next").click();


    //入口
    switch (url) {
        case "/study/courseLearn/resourcesStudy.html":
            _main();
            break;
        case "/study/discussionArea/topicReply.html":
            discussHandler();
            break;
        case "/study/workExam/homeWork/preview.html":
        case "/study/workExam/testWork/preview.html":
        case "/study/onlineExam/preview.html":
        case "/study/workExam/onlineExam/preview.html":
        case "/study/homework/do.html":
            homeworkHandler();
            break;
        case "/study/workExam/homeWork/history.html":
        case "/study/onlineExam/history.html":
        case "/study/workExam/onlineExam/history.html":
        case "/study/workExam/testWork/history.html":
        case "/study/homework/history.html":
            floatHandler();
            break;
        default:
            console.log(`脚本已准备启动 当前位置:${url}`);
            break;
    }

    //当前页
    let current;

    //刷课主逻辑
    function _main() {
        //请求数据
        $("#olTempleteCellModul").click();
        //main函数
        setTimeout(() => {
            //当前小节
            // $("ol .np-section-list") 是目录
            current = $("li.np-section-level.np-section-level-3.active");
            switch (current.data().categoryname) {
                case "pt":
				case "图片":
                case "文档":
                    pptHandler(current);
                    break;
				case "音频":
                case "视频":
                    videoHandler(current);
                    break;
            }
            console.log("当前处理逻辑安排完成,等待执行结果中");
        }, 7000);
    }

    /**
     * 检测课程类别 并深层递归
     */
    function check(current, firstTask) {
		console.log("寻找下一课程...");
        //console.log(current);
        //多级跳转
        if (!firstTask && current.next().length == 0) {
            if (firstTask) console.log(current)
            // current.end();
            //往树根遍历
            //小章节
            let parent = current.closest(".np-section-level-2");
            if (parent.next().length == 0) {
                //大章
                let ancestor = parent.closest(".np-section-level-1")
                //检测是否到终章
                if (ancestor.next().length == 0) {
                    alert("任务完成");
                    //关闭当前窗口
                    // closeTab();
                } else {
                    if (ancestor.next().find(".np-section-level-3").first() === null) return check(ancestor.next().find(".np-section-level-3").first());
					console.log("遍历1：["+ancestor.next().find(".np-section-level-3").first().data().categoryname+"]"+ancestor.next().find(".np-section-level-3").first().data().cellname);
                    check(ancestor.next().find(".np-section-level-3").first(), true);
                }
            } else {
				console.log("遍历2：["+parent.next().find(".np-section-level-3").first().data().categoryname+"]"+parent.next().find(".np-section-level-3").first().data().cellname);
				if (parent.next().find(".np-section-level-3").first().find("span.np-section-type.active").length > 0) {
					check(parent.next().find(".np-section-level-3").first());
				} else {
					let firstCurrent = parent.next().find(".np-section-level-3").first();
					console.log("执行下一项：["+firstCurrent.data().categoryname+"]"+firstCurrent.data().cellname);
					switch (firstCurrent.data().categoryname) {
						case ""://目录
						case "作业":
						case "测验":
							check(firstCurrent);
							break;
						case "讨论":
							setTimeout(() => {
								gotoUrl(firstCurrent)
							}, 20000);
							check(firstCurrent);
							break;
						case "pt":
						case "视频":
						case "音频":
						case "图片":
						case "文档":
							gotoUrl(firstCurrent);
							_main();
							break;
					}
				}
            }
            return;
        }
        if (firstTask) {
		    console.log("检查：["+current.data().categoryname+"]"+current.data().cellname);
            if (current.find("span.np-section-type.active").length > 0) {
                check(current.next());
                return;
            }
		    console.log("执行该项：["+current.data().categoryname+"]"+current.data().cellname);
            gotoUrl(current);
            _main();
        } else {
		console.log("检查：["+current.next().data().categoryname+"]"+current.next().data().cellname);
        //查询下一个是否已完成
        if (current.next().find("span.np-section-type.active").length > 0) {
            check(current.next());
            return;
        }
        //查询下一项所属类别
		console.log("执行下一项：["+current.next().data().categoryname+"]"+current.next().data().cellname);
        switch (current.next().data().categoryname) {
            case ""://目录
            case "作业":
            case "测验":
                check(current.next());
                break;
            case "讨论":
                setTimeout(() => {
                    gotoUrl(current.next())
                }, 20000);
                check(current.next());
                break;
            case "pt":
            case "视频":
			case "音频":
			case "图片":
            case "文档":
                gotoUrl(current.next());
                _main();
                break;
        }
        }
    }
    /**
     * 作业处理
     */
    function homeworkHandler() {
        uncageCopyLimit();
        matchHandler();
        setTimeout(function (){matchProblem()}, 3000);// 自动做题
    }
    /*
     *  解除文本限制
     */
    function uncageCopyLimit() {
        let arr = ["oncontextmenu", "ondragstart", "onselectstart", "onselect", "oncopy", "onbeforecopy"]
        for (let i of arr) {
            $(".hasNoLeft").attr(i, "return true");
        }
        console.log("已成功解除限制");
    }
    /*
     *  匹配题目
     */
    function matchProblem(){
        let intClickList = [], intInputList = [];
        let workExamId = window.location.search.match(/workExamId=([0-9a-z]+)/) || window.location.search.match(/homeWorkId=([0-9a-z]+)/) || window.location.search.match(/examId=([0-9a-z]+)/);

        console.log(workExamId);
        if (workExamId) {
            workExamId = workExamId[1];
        } else {

        }
        if (!workExamId) {
            return $("#_content").val("workExamId 获取失败，请检查地址\n"+window.location);
        }
        let answerLib = MOOCAnswerLib["w2zyaacu49c509itxz8qa"];
        if (!answerLib) {
            return $("#_content").val("没有找到题库");
        }
        for (let i = 0, length = $(".e-q-body").length; i< length; i++) {
            let answerData = 0;
            let pr = 0;
            let type = $(".e-q-body:eq("+i+") .quiz-type").text().replace(/\n/g);
            for (let iLib = 0; iLib < answerLib.length; iLib ++) {// 在题库中匹配最合适的题目
                let v = answerLib[iLib];
                if (!type.includes(v.type)) {
                    answerData = 1;
                    continue;
                }

                if (Trim($(".e-q-body:eq("+i+") .e-q-q .ErichText")[0].innerText.replace(/\n/g), "g") === Trim(v.problem.replace(/\n/g), "g")) {
                    answerData = v;
                    if (type === '填空题' || type === '问答题') {
                        let inputs = $(".e-q-body:eq("+i+") input[type=text]");
                        if (inputs.length === 0) {
                            inputs = $(".e-q-body:eq("+i+") textarea");
                        }
                        if (answerData.answer.length != inputs.length) {
                            console.log(answerData.answer)
                            console.log('填空题'+(i+1)+'答案长度不匹配');
                            continue;
                        }
                        for (let index = 0; index < inputs.length; index++) {
                            //inputs[index].value = answerData.answer[index];
                            intInputList.push([inputs[index], answerData.answer[index]]);
                        }
                        break;
                    }
                    var chooesedCount = 0;
                    for (let iAnswer = 0; iAnswer < answerData.answer.length; iAnswer++) {// 答案文本
                        let chooesItem = $(".e-q-body:eq("+i+") .ErichText");
                        for (let i_ = 0; i_<chooesItem.length; i_++) {
                            //console.log([Trim(chooesItem.eq(i_).text(), "g").substr(1), Trim(answerData.chooes[answerData.answer[iAnswer]], "g"), Trim(chooesItem.eq(i_).text(), "g") == Trim(answerData.chooes[answerData.answer[iAnswer]], "g")])
                            if (Trim(chooesItem.eq(i_).text(), "g").substr(1) == Trim(answerData.chooes[answerData.answer[iAnswer]], "g")) {
                                chooesedCount++;
                                break;
                            }
                        }
                    }
                    if (chooesedCount != answerData.answer.length) {
                        //console.log(["题目匹配成功，选项校验失败"+answerData, $(".e-q-body:eq("+i+") .quiz-type").text(), $(".e-q-body:eq("+i+") .e-q-q div").text()]);
                        continue;
                    }
                    break;
                }

            }
            console.log(["模糊匹配题库", $(".e-q-body:eq("+i+") .e-q-q div").text()]);
            if (typeof(answerData) === "number") {// 模糊匹配题库
                for (let iLib = 0; iLib < answerLib.length; iLib ++) {
                    let v = answerLib[iLib];
                    let prText = compareText($(".e-q-body:eq("+i+") .e-q-q div").text(), v.problem);
                    if (prText < 85) {
                        if (pr === 0) {
                            answerData = 2;
                        }
                    } else if (prText > pr) {
                        pr = prText;
                        answerData = v;
                        if (prText > 92) {
                            break;
                        }
                    }
                }
            }
            if (typeof(answerData) === "number") {
                console.log(["匹配失败"+answerData, $(".e-q-body:eq("+i+") .quiz-type").text(), Trim($(".e-q-body:eq("+i+") .e-q-q .ErichText")[0].innerText.replace(/\n/g), "g")]);
                continue;
            }
            if (type === '填空题' || type === '问答题') {
                continue;
            }
            //console.log([" 匹配成功", $(".e-q-body:eq("+i+") .e-q-q div").text(), answerData.problem, answerData]);
            //answerData
            $("#_content").append("# "+ i +" 题目\n"+answerData.problem+"\n"+ answerData.answer.join("、")+"\n选择：");
            for (let iAnswer = 0; iAnswer < answerData.answer.length; iAnswer++) {// 答案文本
                let chooesItem = $(".e-q-body:eq("+i+") .ErichText");
                for (let i_ = 0; i_<chooesItem.length; i_++) {
                    console.log([i, Trim(chooesItem.eq(i_).text(), "g"), Trim(answerData.chooes[answerData.answer[iAnswer]], "g")])
                    if (Trim(chooesItem.eq(i_).text(), "g") === Trim(answerData.chooes[answerData.answer[iAnswer]], "g")) {
                        //intClickList.push(`if (! $(".e-q-body:eq(${i}) .ErichText").eq(${i_}).hasClass("checked")) $(".e-q-body:eq(${i}) .ErichText").eq(${i_}).click();`);
                        if (!chooesItem.eq(i_).hasClass("checked")) {
                            //$(".e-q-body:eq("+i+") .ErichText").eq(i_).click();
                        }
                        intClickList.push(`$(".e-q-body:eq(${i}) .ErichText").eq(${i_})`);
                        $("#_content").append(answerData.chooes[answerData.answer[iAnswer]]+"\n");
                        break;
                    }
                }
            }

        }
        console.log("开始选取答案");
        $("#_content").append("开始选取答案\n");
        let intClickIndex = 0;
        let intInputIndex = 0;
        var intId = setInterval(function (){
             if (intInputIndex < intInputList.length){
                $("#_content").append("填空进度："+intInputIndex+"/"+intInputList.length+"\n");
                intInputList[intInputIndex][0].select();
                intInputList[intInputIndex][0].value = intInputList[intInputIndex][1];
                intInputIndex ++;
            } else if (intClickIndex < intClickList.length) {
                $("#_content").append("进度："+intClickIndex+"/"+intClickList.length+"\n");
                let ele = eval(intClickList[intClickIndex]);
                intClickIndex ++;
                if (ele.hasClass("checked")) {
                    return;
                }
                ele.click();
            } else {
                clearInterval(intId);
                console.log("答案选取完毕");
                $("#_content").append("答案选取完毕\n");
                //submitHomeWork();
                $("#submitHomeWork").click();
            }
            //获取id为textarea的滚动条高度
            var top = $("#_content")[0].scrollHeight;
            //滚动条滚动到最下方
            $("#_content").scrollTop(top);
        }, 500);
    }
    /*
     *  一键乱写题目
     */
    function writeProblem(){
        for (let i = 0, length = $(".e-q-body").length; i< length; i++) {
            let chooesItem = $(".e-q-body:eq("+i+") .ErichText");
            for (let i_ = 0; i_<chooesItem.length; i_++) {
                chooesItem.eq(i_).click();
            }
        }
        $("#_content").append("答案乱填完毕\n");
    }
    function submitHomeWork() {
        $("#submitHomeWork").click();
        setTimeout(function (){
            $(".btnArea .ok").click();
        }, 500);
    }
    /*
     *  匹配题目主题UI
     */
    function matchHandler() {
        const div = `<div style="border:#42b983 solid 2px;width: 330px; position: fixed; top: 0; right: 10px;  z-index: 99999">
                        <button id="match_btn">匹配题目</button> <button id="write_btn">一键填写</button> <button id="submitHomeWork_btn">提交</button>
                        <hr/>
                        <textarea id="_content" style="width: 100%;height: 300px;border: #B3C0D1 solid 2px;overflow: auto;font-size: x-small" />
                    </div>`;
        $(div).appendTo('body');
        $("#match_btn").bind('click', () => matchProblem());
        $("#write_btn").bind('click', () => writeProblem());
        $("#submitHomeWork_btn").bind('click', () => submitHomeWork());
    }
    /**
     * 视频类处理
     */
    function videoHandler(current) {
        let player = top.jwplayer($(".jwplayer").attr("id"));
        //播放回调
        if (player.getState() == "complete") {
            console.log("视频原已播放完毕\n");
            delayExec(commentHandler(current));
            return;
        }
        //配置
        player.setMute(true)//静音
        player.setPlaybackRate(setting.videoPlaybackRate);
        player.setCurrentQuality(setting.videoQuality);
        if (setting.skipVideo) {
            player.on("time",()=>{
                var time = jwplayer($(".jwplayer").attr("id")).getPosition();
                console.log(time);//视频播放进度（秒）
                if(time <= top.jwplayer($(".jwplayer").attr("id")).getDuration()-5){
                    top.jwplayer($(".jwplayer").attr("id")).seek(top.jwplayer($(".jwplayer").attr("id")).getDuration()-1);
                }
            })
            console.log("已跳过媒体\n");
        }

        //播放回调
        player.on("playlistComplete", () => {
            console.log("视频播放完成\n");
            delayExec(commentHandler(current));
        });
    }
    /**
     * PPT类别处理
     */
    function pptHandler(current) {
        //等待2秒后执行,避免不正常操作加载时间
        //延迟提交评论
        delayExec(commentHandler(current));
    }
    /**
     * 提取当前页内容
     */
    function exactProblem() {
        const arr = $(".e-q-body");
        let text = "";

        for (let x = 0; x < arr.length; x++)
            if (arr[x].innerText != "") text += arr[x].innerText;
        $("#_content").val(text);

    }
    function exactProblemToJSON() {
        const arr = $(".e-q-body");
        let text = "";
		let problemType = ["判断题", "多选题", "单选题", "填空题", "问答题", "阅读理解"];
		let isProblemContext = false;
        let isChooesContext = false;
		let saveOfData = [];
        let letterList = ["A", "B", "C", "D", "E", "F"];

        for (let x = 0; x < arr.length; x++) {
            let obj = {type: "", problem: "", chooes: [], answer: []};
            obj.problem = $(".e-q-body:eq("+x+") .e-q-q:eq(0) .ErichText:eq(0)")[0].innerText.replace(/\n/g, '');// 题目

            obj.type = $(".e-q-body:eq("+x+") .quiz-type:eq(0)")[0].innerText; // 题目类型
            if (obj.type === problemType[3]) {// 填空题 特判
                let answers = $(".e-q-body:eq("+x+") .e-blank-i");
                for (let i = 0; i< answers.length; i++) {
                    obj.answer[i] = Trim(answers[i].innerText.replace(/\n/g, ''), 'g')
                }
                saveOfData.push(obj);
                continue;
            }
            console.log(problemType[4])
            if (obj.type === problemType[4]) {// 问答题 特判
                obj.answer[0] = Trim($(".e-q-body:eq("+x+") .e-ans-r:eq(0)")[0].innerText.replace(/\n/g, ''), 'g')
                saveOfData.push(obj);
                continue;
            }

            let problemList = $(".e-q-body:eq("+x+") .e-a-g:eq(0) .e-a");// 选项
            for (let i = 0; i<problemList.length; i++) {
                let text = problemList.eq(i)[0].innerText.replace(/\n/g, '');
                if (!letterList.includes(text.substr(0, 1))) {
					continue;
				}
                let context = "";
                if (text.substr(1,1) === ")") {
                    context = text.substr(3);
                } else {
                    context = text.substr(2);
                }
                if (context == "") {
                    isChooesContext = true;
                    continue;
                }
                obj.chooes.push(context);
            }

            let answer = Trim($(".e-q-body:eq("+x+") .e-ans-ref:eq(0)")[0].innerText.substr(6), "g");
            if (/^[a-zA-Z]+$/.test(answer.substr(0, 1))) {
                answer.split("").forEach(function(v) {
                    obj.answer.push(letterList.indexOf(v));
                });
            } else if (answer === "正确") {
                obj.answer.push(0);
            } else if (answer === "错误") {
                obj.answer.push(1);
            }
            saveOfData.push(obj);
		}
        let workExamId = window.location.search.match(/workExamId=([0-9a-z]+)/) || window.location.search.match(/homeWorkId=([0-9a-z]+)/) || window.location.search.match(/stuOnlineExamId=([0-9a-z]+)/);
        if (workExamId === null) {
        } else {
            workExamId = workExamId[1];
        }
        if (!workExamId) {
            return $("#_content").val("workExamId 获取失败，请检查地址\n"+window.location);
        }
        let backObj = {};
        backObj[workExamId] = saveOfData;
        //$("#_content").val(JSON.stringify(backObj));
        let str = JSON.stringify(saveOfData).substr(1);
        str = str.substr(0, str.length-1)
        $("#_content").val(str);
    }

    /**
     * 提取题目
     */
    function floatHandler() {
        const div = `<div style="border:#42b983 solid 2px;width: 330px; position: fixed; top: 0; right: 10px;  z-index: 99999">
                        <button id="extract_btn">提取文本</button> <button id="extractToJSON_btn">提取为JSON</button>
                        <hr/>
                        <textarea id="_content" style="width: 100%;height: 300px;border: #B3C0D1 solid 2px;overflow: auto;font-size: x-small" />
                    </div>`;
        $(div).appendTo('body');
        $("#extract_btn").bind('click', () => exactProblem());
        $("#extractToJSON_btn").bind('click', () => exactProblemToJSON());
    }



    /**
    * 提交评论
    */
    function commentHandler(current) {

        if (setting.isOpenComment) {
            //评5星
            $("#star #starImg4").click();
            //随机从词库填写评论
            let content = setting.randomComment[rnd(0, setting.randomComment.length - 1)];
            if (content == undefined) {
                console.log("评论失败："+content);
            }
            $("iframe#ueditor_0").contents().find("body.view")[0].innerText = content;
            //提交
            delayExec(() => {
                $("#btnComment").click();
                delayExec(() => {
                    $(".sgBtn.ok").click();
                    console.log("评论成功\n");
                    window.close();
                    check(current);
                });
            });
        } else {
            check(current);
        }

    }
    /**
    * 提交讨论
    */
    function discussHandler() {
        setTimeout(() => {
            //获取上一位的评论  隔两个索引为评论  字数太少往下查找,避免太水
            let vaildComment = findVaildDiscuss();
            // //开启HTML输入模式
            // $EDITORUI["edui945"]._onClick();
            if (vaildComment == undefined) {
                console.log("讨论区没有合适评论\n");
                vaildComment = setting.randomComment[rnd(0, setting.randomComment.length - 1)];
            }
            //填充评论
            $("iframe#ueditor_0").contents().find("body.view")[0].innerText = vaildComment;
            //提交
            delayExec(() => {
                $(".btn_replyTopic").click();
                console.log("讨论成功\n");
                window.close();
            }
            );
        }, 10000);
        /*  //返回上一页
         delayExec(() => window.history.go(-1)); */
    }

    /**
     * 简单地找出一个有效的讨论
     */
    function findVaildDiscuss() {
        let arr = $(".mc-learning-table  tbody tr div[id^='istext_']"), element;
        for (let i = 0; i < arr.length; i++) {
            element = arr[i].innerText;
            if (element.length > 10)
                return element;
        }
        return element;
    }
    /**
     * 去除文本内空格和换行
     */
    function Trim(str, is_global)
    {
        var result;
        result = str.replace(/(^\s+)|(\s+$)/g,"");
        if(is_global=="g")
        {
            result = result.replace(/\s|\n/g,"");
        }
        return result;
    }
    function deteleObject(obj) {
        var uniques = [];
        var stringify = {};
        for (var i = 0; i < obj.length; i++) {
            var keys = Object.keys(obj[i]);
            keys.sort(function(a, b) {
                return (Number(a) - Number(b));
            });
            var str = '';
            for (var j = 0; j < keys.length; j++) {
                str += JSON.stringify(keys[j]);
                str += JSON.stringify(obj[i][keys[j]]);
            }
            if (!stringify.hasOwnProperty(str)) {
                uniques.push(obj[i]);
                stringify[str] = true;
            }
        }
        uniques = uniques;
        return uniques;
    }
    /**
     * 简单的匹配文本相似度
     */
    function compareText(x, y) {
        if (typeof(x) === "string") x = Trim(x, "g").split("");
        if (typeof(y) === "string") y = Trim(y, "g").split("");
        var z = 0;
        var s = x.length + y.length;;
        x.sort();
        y.sort();
        var a = x.shift();
        var b = y.shift();
        while (a !== undefined && b !== undefined) {
            if (a === b) {
                z++;
                a = x.shift();
                b = y.shift();
            } else if (a < b) {
                a = x.shift();
            } else if (a > b) {
                b = y.shift();
            }
        }
        return z / s * 200;
    }
    var MOOCAnswerLib = {"w2zyaacu49c509itxz8qa":[

    ]};
    console.log(MOOCAnswerLib.w2zyaacu49c509itxz8qa.length)
})();
