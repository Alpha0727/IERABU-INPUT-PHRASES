// ==UserScript==
// @name         いえらぶ｜入力用文言コピー
// @namespace    https://ielove.jp/
// @version      4.3.0
// @description  いえらぶ用 定型文コピー・編集・デフォルト管理
// @match        *://*.ielove.jp/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // =========================================================
    // 基本設定
    // =========================================================

    const STORAGE_KEY = 'ielove_input_phrases_v4_1';

    const INITIAL_GROUPS = [
        {
            id: 'cleaning',
            title: '退去時・クリーニング',
            items: [
                '退去時室内クリーニング代実費精算。',
                '退去時室内クリーニング代（55000円）借主負担。',
                '退去時ルームクリーニング代38500円・エアコンクリーニング代11000円借主負担。',
                '退去時ルームクリーニング代39600円・エアコンクリーニング代16500円借主負担。',
                '退去時エアコンクリーニング代11000円借主負担。'
            ]
        },
        {
            id: 'penalty',
            title: '短期違約金',
            items: [
                '短期違約金として、1年未満の解約は賃料等の1ヶ月となります。',
                '短期違約金として、1年未満の解約は賃料等の2ヶ月となり、2年未満の解約は賃料等の1ヶ月となります。',
                '短期違約金として、1年未満の解約は賃料等の1ヶ月となり、2年未満の解約は賃料等の0.5ヶ月となります。',
                '短期違約金として、半年未満の解約は賃料等の2ヶ月となり、1年未満の解約は賃料等の1ヶ月となります。',
                '短期違約金として、半年未満の解約は賃料等の3ヶ月、1年未満の解約は賃料等の2ヶ月、2年未満の解約は賃料等の1ヶ月となります。'
            ]
        },
        {
            id: 'pet',
            title: 'ペット',
            items: [
                'ペット飼育の場合、敷金1ヶ月積み増し、退去時実費精算となります。',
                'ペット飼育の場合、敷金1ヶ月積み増し、退去時1ヶ月償却となります。',
                'ペット飼育の場合、敷金2ヶ月積み増し、退去時2ヶ月償却となります。',
                'ペット飼育の場合、家賃3000円アップとなります。'
            ]
        },
        {
            id: 'fixed',
            title: '定期借家',
            items: [
                '再契約型定期借家契約2年。（再契約料：新賃料の1ヶ月分）',
                '定期借家2年。再契約不可。'
            ]
        },
        {
            id: 'other',
            title: 'その他',
            items: [
                'LPG預り金10000円'
            ]
        },
        {
            id: 'notice',
            title: '告知事項',
            items: [
                '告知事項あり。',
                '心理的瑕疵あり。'
            ]
        }
    ];

    // =========================================================
    // カテゴリタブ
    // =========================================================

    const TAB_ITEMS = [
        { id: 'cleaning', label: 'クリーニング' },
        { id: 'penalty',  label: '短期' },
        { id: 'pet',      label: 'ペット' },
        { id: 'fixed',    label: '定借' },
        { id: 'notice',   label: '告知' },
        { id: 'other',    label: 'その他' }
    ];

    let activeGroupId = 'cleaning';

    // =========================================================
    // データ
    // =========================================================

    function createId() {
        return (
            'phrase_' +
            Date.now() +
            '_' +
            Math.random().toString(36).slice(2, 8)
        );
    }

    function createInitialData() {
        return INITIAL_GROUPS.map(group => ({
            id: group.id,
            title: group.title,
            items: group.items.map((text, index) => ({
                id: `${group.id}_${index}`,
                text: text,
                defaultText: text,
                builtIn: true
            }))
        }));
    }

    function normalizeNoticeData(parsed) {
        const noticeGroup = parsed.find(group => group.id === 'notice');

        if (!noticeGroup) {
            return parsed;
        }

        if (noticeGroup.items?.[0]) {
            noticeGroup.items[0].text =
                noticeGroup.items[0].text
                    .replace('　※下記以外全て', '')
                    .replace('※下記以外全て', '')
                    .trim();

            noticeGroup.items[0].defaultText =
                noticeGroup.items[0].defaultText
                    .replace('　※下記以外全て', '')
                    .replace('※下記以外全て', '')
                    .trim();
        }

        if (noticeGroup.items?.[1]) {
            noticeGroup.items[1].text =
                noticeGroup.items[1].text
                    .replace('　※人が死んだ場合の「HOME\'Sのみ」', '')
                    .replace('※人が死んだ場合の「HOME\'Sのみ」', '')
                    .trim();

            noticeGroup.items[1].defaultText =
                noticeGroup.items[1].defaultText
                    .replace('　※人が死んだ場合の「HOME\'Sのみ」', '')
                    .replace('※人が死んだ場合の「HOME\'Sのみ」', '')
                    .trim();
        }

        return parsed;
    }

    function loadData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);

            if (!raw) {
                return createInitialData();
            }

            const parsed = JSON.parse(raw);

            if (!Array.isArray(parsed)) {
                return createInitialData();
            }

            return normalizeNoticeData(parsed);

        } catch (error) {
            console.error(
                '[入力用文言] データ読み込みエラー',
                error
            );

            return createInitialData();
        }
    }

    let data = loadData();

    function saveData() {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );
    }

    // =========================================================
    // コピー
    // =========================================================

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;

        } catch (error) {

            try {
                const textarea =
                    document.createElement('textarea');

                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                textarea.style.top = '-9999px';

                document.body.appendChild(textarea);

                textarea.focus();
                textarea.select();

                document.execCommand('copy');

                textarea.remove();

                return true;

            } catch (fallbackError) {
                console.error(
                    '[入力用文言] コピー失敗',
                    fallbackError
                );

                return false;
            }
        }
    }

    // =========================================================
    // SVG
    // =========================================================

    const ICONS = {

        default: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="
                    M12 2.4
                    L14.9 8.3
                    L21.4 9.2
                    L16.7 13.8
                    L17.8 20.3
                    L12 17.2
                    L6.2 20.3
                    L7.3 13.8
                    L2.6 9.2
                    L9.1 8.3
                    Z
                "></path>
            </svg>
        `,

        copy: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="
                    M8 7V3h13v13h-4v5H3V7h5zm2 0h7v7h2V5h-9v2zm5 2H5v10h10V9z
                "></path>
            </svg>
        `,

        reset: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="
                    M7.1 7.1A7 7 0 1 1 5 12H3
                    a9 9 0 1 0 2.6-6.4L2 2v7h7L7.1 7.1z
                "></path>
            </svg>
        `,

        delete: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="
                    M7 7h10l-.8 14H7.8L7 7zm3-4h4l1 2h4v2H5V5h4l1-2z
                "></path>
            </svg>
        `,

        add: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="
                    M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z
                "></path>
            </svg>
        `,

        close: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="
                    M6.4 5L12 10.6 17.6 5 19 6.4
                    13.4 12 19 17.6 17.6 19
                    12 13.4 6.4 19 5 17.6
                    10.6 12 5 6.4 6.4 5z
                "></path>
            </svg>
        `
    };

    // =========================================================
    // CSS
    // =========================================================

    const style = document.createElement('style');

    style.textContent = `

        #ielovePhraseLauncher {
            position: fixed;
            left: 14px;
            bottom: 14px;
            z-index: 2147483640;

            height: 40px;
            padding: 0 14px;

            border: 1px solid #b8c0c8;
            border-radius: 8px;

            background: #ffffff;
            color: #222222;

            box-shadow: 0 3px 10px rgba(0,0,0,0.18);

            font-size: 13px;
            font-weight: 700;

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                "Yu Gothic",
                "Meiryo",
                sans-serif;

            cursor: pointer;
        }

        #ielovePhraseLauncher:hover {
            background: #f4f7fa;
        }


        /*
         * ★ 横幅を変えたい時は、この数値だけ変更してください。
         * 例: 430px → 400px → 380px
         * 中のタブ・入力欄・操作ボタンは自動で追従します。
         */
        :root {
            --ielove-phrase-width: 430px;
        }

        #ielovePhrasePanel {
            position: fixed;

            left: 14px;
            bottom: 144px;

            width: min(
                var(--ielove-phrase-width),
                calc(100vw - 28px)
            );

            min-width: 0;

            height: min(600px, 60vh);

            z-index: 2147483641;

            display: none;
            flex-direction: column;

            background: #f4f6f8;

            border: 1px solid #b7c0c8;
            border-radius: 10px;

            box-shadow: 0 8px 25px rgba(0,0,0,0.24);

            overflow: hidden;

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                "Yu Gothic",
                "Meiryo",
                sans-serif;
        }

        #ielovePhrasePanel.open {
            display: flex;
        }

        #ielovePhrasePanel,
        #ielovePhrasePanel * {
            box-sizing: border-box;
        }


        .ielovePhraseHeader {
            flex-shrink: 0;

            height: 42px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            padding: 0 8px 0 13px;

            background: #ffffff;

            border-bottom: 1px solid #d7dde3;
        }

        .ielovePhraseTitle {
            color: #1d2b36;
            font-size: 15px;
            font-weight: 700;
        }

        .ielovePhraseClose {
            width: 30px;
            height: 30px;

            display: flex;
            align-items: center;
            justify-content: center;

            border: none;
            border-radius: 6px;

            background: transparent;
            color: #607080;

            cursor: pointer;
        }

        .ielovePhraseClose:hover {
            background: #edf1f4;
        }

        .ielovePhraseClose svg {
            width: 17px;
            height: 17px;
            fill: currentColor;
        }


        .ielovePhraseTabs {
            flex-shrink: 0;

            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));

            gap: 3px;

            width: 100%;
            padding: 6px 7px;

            background: #f4f6f8;

            border-bottom: 1px solid #d7dde3;
        }

        .ielovePhraseTab {
            min-width: 0;
            height: 30px;

            padding: 0 1px;

            border: 1px solid #cbd3da;
            border-radius: 5px;

            background: #ffffff;
            color: #4a5660;

            font-size: 10px;
            font-weight: 700;

            white-space: nowrap;
            overflow: hidden;
            text-overflow: clip;

            cursor: pointer;
        }

        .ielovePhraseTab:hover {
            background: #edf2f6;
        }

        .ielovePhraseTab.active {
            background: #205375;
            border-color: #205375;
            color: #ffffff;
        }

        .ielovePhraseTab[data-group="cleaning"] {
            font-size: 9.5px;
            letter-spacing: -0.5px;
        }


        .ielovePhraseBody {
            flex: 1;

            padding: 7px 8px 10px;

            overflow-y: auto;
            overflow-x: hidden;
        }


        .ielovePhraseGroup {
            margin-bottom: 8px;

            overflow: hidden;

            background: #ffffff;

            border: 1px solid #d9dfe4;
            border-radius: 7px;
        }

        .ielovePhraseGroupHeader {
            height: 32px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            padding: 0 5px 0 9px;

            background: #edf1f4;

            border-bottom: 1px solid #d9dfe4;
        }

        .ielovePhraseGroupTitle {
            color: #252b31;
            font-size: 12px;
            font-weight: 700;
        }


        .ielovePhraseAdd {
            width: 27px;
            height: 25px;

            display: flex;
            align-items: center;
            justify-content: center;

            border: 1px solid #8eb2d9;
            border-radius: 5px;

            background: #e7f2ff;
            color: #1d69a6;

            cursor: pointer;
        }

        .ielovePhraseAdd:hover {
            background: #d8ebff;
        }

        .ielovePhraseAdd svg {
            width: 15px;
            height: 15px;
            fill: currentColor;
        }


        .ielovePhraseRow {
            display: flex;
            flex-direction: column;
            align-items: stretch;

            gap: 4px;

            width: 100%;
            padding: 5px;

            border-bottom: 1px solid #edf0f2;
        }

        .ielovePhraseRow:last-child {
            border-bottom: none;
        }


        .ielovePhraseInput {
            width: 100%;
            min-width: 0;

            height: 43px;
            min-height: 43px;
            max-height: 100px;

            resize: vertical;

            padding: 6px 8px;

            border: 1px solid #b9c2cb;
            border-radius: 5px;

            outline: none;

            background: #ffffff;

            color: #111111;

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                "Yu Gothic",
                "Meiryo",
                sans-serif;

            font-size: 13px;
            font-weight: 500;
            line-height: 1.45;
        }

        .ielovePhraseInput:hover {
            border-color: #94a5b5;
        }

        .ielovePhraseInput:focus {
            border-color: #4382bd;
            box-shadow: 0 0 0 2px rgba(67,130,189,0.12);
        }


        .ielovePhraseActions {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));

            gap: 4px;

            width: 100%;
        }


        .ielovePhraseIconButton {
            width: 100%;
            min-width: 0;
            height: 28px;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 0;

            border: none;
            border-radius: 5px;

            cursor: pointer;

            transition:
                filter 0.12s,
                transform 0.08s;
        }

        .ielovePhraseIconButton:hover {
            filter: brightness(0.94);
        }

        .ielovePhraseIconButton:active {
            transform: translateY(1px);
        }

        .ielovePhraseIconButton svg {
            width: 15px;
            height: 15px;
            fill: currentColor;
        }


        .ielovePhraseDefault {
            background: #fff1ba;
            color: #9b6a00;
        }

        .ielovePhraseCopy {
            background: #2d72ad;
            color: #ffffff;
        }

        .ielovePhraseCopy.copied {
            background: #258153;
        }

        .ielovePhraseReset {
            background: #e6f1ff;
            color: #356d9e;
        }

        .ielovePhraseDelete {
            background: #ffe3e6;
            color: #c6404c;
        }


        #ielovePhraseModalOverlay {
            position: fixed;

            inset: 0;

            z-index: 2147483646;

            display: none;

            align-items: center;
            justify-content: center;

            background: rgba(10,20,30,0.28);
        }

        #ielovePhraseModalOverlay.open {
            display: flex;
        }


        #ielovePhraseModal {
            width: min(520px, calc(100vw - 40px));

            background: #ffffff;

            border: 1px solid #b6c0ca;
            border-radius: 10px;

            box-shadow: 0 14px 40px rgba(0,0,0,0.28);

            overflow: hidden;
        }

        .ielovePhraseModalHeader {
            height: 42px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            padding: 0 9px 0 14px;

            background: #f4f6f8;

            border-bottom: 1px solid #dde2e6;
        }

        .ielovePhraseModalTitle {
            color: #202b33;
            font-size: 14px;
            font-weight: 700;
        }

        .ielovePhraseModalClose {
            width: 29px;
            height: 29px;

            display: flex;
            align-items: center;
            justify-content: center;

            border: none;
            border-radius: 5px;

            background: transparent;
            color: #5c6975;

            cursor: pointer;
        }

        .ielovePhraseModalClose:hover {
            background: #e6ebef;
        }

        .ielovePhraseModalClose svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }


        .ielovePhraseModalBody {
            padding: 14px;
        }

        .ielovePhraseModalLabel {
            margin-bottom: 6px;

            color: #596774;

            font-size: 11px;
            font-weight: 700;
        }

        #ielovePhraseModalTextarea {
            width: 100%;
            min-height: 100px;

            box-sizing: border-box;

            padding: 10px;

            resize: vertical;

            border: 1px solid #aeb9c3;
            border-radius: 6px;

            outline: none;

            background: #ffffff;

            color: #111111;

            font-size: 14px;
            line-height: 1.5;

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                "Yu Gothic",
                "Meiryo",
                sans-serif;
        }

        #ielovePhraseModalTextarea:focus {
            border-color: #4382bd;
            box-shadow: 0 0 0 2px rgba(67,130,189,0.13);
        }


        .ielovePhraseModalInfo {
            margin-top: 8px;

            color: #6e7a84;

            font-size: 11px;
            line-height: 1.5;
        }


        .ielovePhraseModalFooter {
            display: flex;
            justify-content: flex-end;

            gap: 7px;

            padding: 10px 14px;

            background: #f7f8f9;

            border-top: 1px solid #e1e5e8;
        }


        .ielovePhraseModalButton {
            min-width: 74px;
            height: 32px;

            padding: 0 13px;

            border-radius: 6px;

            font-size: 12px;
            font-weight: 700;

            cursor: pointer;
        }

        .ielovePhraseModalCancel {
            border: 1px solid #c0c7ce;
            background: #ffffff;
            color: #4b5660;
        }

        .ielovePhraseModalSave {
            border: 1px solid #25679d;
            background: #2d72ad;
            color: #ffffff;
        }

        .ielovePhraseModalSave:hover {
            background: #245f90;
        }

        .ieloveFastTooltip {
            position: fixed;
            z-index: 2147483647;

            padding: 7px 9px;

            background: #263238;
            color: #ffffff;

            border-radius: 6px;

            font-size: 12px;
            line-height: 1.4;

            box-shadow: 0 4px 12px rgba(0,0,0,0.22);

            pointer-events: none;

            opacity: 0;

            transition: opacity 0.05s ease;

            white-space: nowrap;
        }

        .ieloveFastTooltip.show {
            opacity: 1;
        }

`;

    document.head.appendChild(style);

    // =========================================================
    // 起動ボタン
    // =========================================================

    const launcher = document.createElement('button');

    launcher.id = 'ielovePhraseLauncher';
    launcher.type = 'button';
    launcher.textContent = '【入力用文言】';

    document.body.appendChild(launcher);

    const fastTooltip = document.createElement('div');

fastTooltip.className = 'ieloveFastTooltip';

document.body.appendChild(fastTooltip);

function showFastTooltip(element, text) {

    fastTooltip.textContent = text;

    const rect =
        element.getBoundingClientRect();

    fastTooltip.style.left =
        `${rect.left + rect.width / 2}px`;

    fastTooltip.style.top =
        `${rect.top - 8}px`;

    fastTooltip.style.transform =
        'translate(-50%, -100%)';

    fastTooltip.classList.add('show');
}

function hideFastTooltip() {
    fastTooltip.classList.remove('show');
}

function bindFastTooltip(element, textOrGetter) {

    // ブラウザ標準の遅いtitleツールチップは使わない
    element.removeAttribute('title');

    element.addEventListener(
        'mouseenter',
        () => {

            const tooltipText =
                typeof textOrGetter === 'function'
                    ? textOrGetter()
                    : textOrGetter;

            if (!tooltipText) {
                return;
            }

            showFastTooltip(
                element,
                tooltipText
            );
        }
    );

    element.addEventListener(
        'mouseleave',
        hideFastTooltip
    );

    element.addEventListener(
        'mousedown',