// ==UserScript==
// @name         いえらぶ｜入力用文言コピー
// @namespace    https://ielove.jp/
// @version      4.3.1
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
        hideFastTooltip
    );
}

    // =========================================================
    // メインパネル
    // =========================================================

    const panel = document.createElement('div');

    panel.id = 'ielovePhrasePanel';

    panel.innerHTML = `

        <div class="ielovePhraseHeader">

            <div class="ielovePhraseTitle">
                入力用文言
            </div>

            <button
                type="button"
                class="ielovePhraseClose"
                id="ielovePhraseClose"
                title="閉じる"
            >
                ${ICONS.close}
            </button>

        </div>

        <div
            class="ielovePhraseTabs"
            id="ielovePhraseTabs"
        ></div>

        <div
            class="ielovePhraseBody"
            id="ielovePhraseBody"
        ></div>

    `;

    document.body.appendChild(panel);

    const tabs =
        panel.querySelector('#ielovePhraseTabs');

    const body =
        panel.querySelector('#ielovePhraseBody');

    // =========================================================
    // モーダル
    // =========================================================

    const modalOverlay =
        document.createElement('div');

    modalOverlay.id =
        'ielovePhraseModalOverlay';

    modalOverlay.innerHTML = `

        <div id="ielovePhraseModal">

            <div class="ielovePhraseModalHeader">

                <div
                    class="ielovePhraseModalTitle"
                    id="ielovePhraseModalTitle"
                ></div>

                <button
                    type="button"
                    class="ielovePhraseModalClose"
                    id="ielovePhraseModalClose"
                >
                    ${ICONS.close}
                </button>

            </div>

            <div class="ielovePhraseModalBody">

                <div
                    class="ielovePhraseModalLabel"
                >
                    文言
                </div>

                <textarea
                    id="ielovePhraseModalTextarea"
                ></textarea>

                <div
                    class="ielovePhraseModalInfo"
                    id="ielovePhraseModalInfo"
                ></div>

            </div>

            <div class="ielovePhraseModalFooter">

                <button
                    type="button"
                    class="
                        ielovePhraseModalButton
                        ielovePhraseModalCancel
                    "
                    id="ielovePhraseModalCancel"
                >
                    キャンセル
                </button>

                <button
                    type="button"
                    class="
                        ielovePhraseModalButton
                        ielovePhraseModalSave
                    "
                    id="ielovePhraseModalSave"
                >
                    保存
                </button>

            </div>

        </div>

    `;

    document.body.appendChild(modalOverlay);

    const modalTitle =
        document.getElementById('ielovePhraseModalTitle');

    const modalTextarea =
        document.getElementById('ielovePhraseModalTextarea');

    const modalInfo =
        document.getElementById('ielovePhraseModalInfo');

    const modalSave =
        document.getElementById('ielovePhraseModalSave');

    // =========================================================
    // モーダル制御
    // =========================================================

    let modalMode = null;
    let modalGroupIndex = null;
    let modalItemIndex = null;

    function openDefaultModal(groupIndex, itemIndex) {

        modalMode = 'default';
        modalGroupIndex = groupIndex;
        modalItemIndex = itemIndex;

        const item =
            data[groupIndex].items[itemIndex];

        modalTitle.textContent =
            'デフォルト文言を変更';

        modalTextarea.value =
            item.defaultText;

        modalInfo.textContent =
            '現在入力欄に別の文言を入力している場合、デフォルトを変更しても現在の入力内容は変更されません。';

        modalOverlay.classList.add('open');

        setTimeout(() => {
            modalTextarea.focus();
            modalTextarea.select();
        }, 30);
    }

    function openAddModal(groupIndex) {

        modalMode = 'add';
        modalGroupIndex = groupIndex;
        modalItemIndex = null;

        modalTitle.textContent =
            `「${data[groupIndex].title}」に文言追加`;

        modalTextarea.value = '';

        modalInfo.textContent =
            'ここで入力した文章が、新しい行の最初のデフォルト文言になります。';

        modalOverlay.classList.add('open');

        setTimeout(() => {
            modalTextarea.focus();
        }, 30);
    }

    function closeModal() {

        modalOverlay.classList.remove('open');

        modalMode = null;
        modalGroupIndex = null;
        modalItemIndex = null;
    }

    // =========================================================
    // モーダル保存
    // =========================================================

    modalSave.addEventListener(
        'click',
        () => {

            const newText =
                modalTextarea.value.trim();

            if (!newText) {
                alert('文言を入力してください。');
                return;
            }

            if (modalMode === 'default') {

                const item =
                    data[modalGroupIndex]
                        .items[modalItemIndex];

                const oldDefault =
                    item.defaultText;

                const currentlyDefault =
                    item.text === oldDefault;

                item.defaultText =
                    newText;

                if (currentlyDefault) {
                    item.text =
                        newText;
                }

                saveData();
                render();
                closeModal();

                return;
            }

            if (modalMode === 'add') {

                data[modalGroupIndex]
                    .items
                    .push({
                        id: createId(),
                        text: newText,
                        defaultText: newText,
                        builtIn: false
                    });

                saveData();
                render();
                closeModal();
            }
        }
    );

    document
        .getElementById('ielovePhraseModalClose')
        .addEventListener(
            'click',
            closeModal
        );

    document
        .getElementById('ielovePhraseModalCancel')
        .addEventListener(
            'click',
            closeModal
        );

    modalOverlay.addEventListener(
        'click',
        event => {

            if (event.target === modalOverlay) {
                closeModal();
            }
        }
    );

    // =========================================================
    // タブ描画
    // =========================================================

    function renderTabs() {

        tabs.innerHTML = '';

        TAB_ITEMS.forEach(
            tab => {

                const button =
                    document.createElement('button');

                button.type =
                    'button';

                button.className =
                    'ielovePhraseTab' +
                    (
                        tab.id === activeGroupId
                            ? ' active'
                            : ''
                    );

                button.dataset.group =
                    tab.id;

                button.textContent =
                    tab.label;

                button.addEventListener(
                    'click',
                    () => {

                        if (
                            activeGroupId ===
                            tab.id
                        ) {
                            return;
                        }

                        activeGroupId =
                            tab.id;

                        renderTabs();
                        render();
                    }
                );

                tabs.appendChild(
                    button
                );
            }
        );
    }

    // =========================================================
    // 描画
    // =========================================================

    function render() {

        body.innerHTML = '';

        data.forEach(
            (group, groupIndex) => {

                if (
                    group.id !==
                    activeGroupId
                ) {
                    return;
                }

                const groupElement =
                    document.createElement('div');

                groupElement.className =
                    'ielovePhraseGroup';

                const groupHeader =
                    document.createElement('div');

                groupHeader.className =
                    'ielovePhraseGroupHeader';

                const groupTitle =
                    document.createElement('div');

                groupTitle.className =
                    'ielovePhraseGroupTitle';

                groupTitle.textContent =
                    group.title;

                const addButton =
                    document.createElement('button');

                addButton.type =
                    'button';

                addButton.className =
                    'ielovePhraseAdd';

                addButton.innerHTML =
                    ICONS.add;

                addButton.title =
                    '文言を追加';

                addButton.addEventListener(
                    'click',
                    () => {
                        openAddModal(
                            groupIndex
                        );
                    }
                );

                groupHeader.appendChild(
                    groupTitle
                );

                groupHeader.appendChild(
                    addButton
                );

                groupElement.appendChild(
                    groupHeader
                );

                group.items.forEach(
                    (item, itemIndex) => {

                        const row =
                            document.createElement('div');

                        row.className =
                            'ielovePhraseRow';

                        // =================
                        // ★ デフォルト変更
                        // =================

                        const defaultButton =
                            document.createElement('button');

                        defaultButton.type =
                            'button';

                        defaultButton.className =
                            `
                            ielovePhraseIconButton
                            ielovePhraseDefault
                            `;

                        defaultButton.innerHTML =
                            ICONS.default;

                        bindFastTooltip(
                            defaultButton,
                            'デフォルト文言を変更'
                        );

                        defaultButton.addEventListener(
                            'click',
                            () => {

                                openDefaultModal(
                                    groupIndex,
                                    itemIndex
                                );
                            }
                        );

                        // =================
                        // 入力欄
                        // =================

                        const textarea =
                            document.createElement('textarea');

                        textarea.className =
                            'ielovePhraseInput';

                        textarea.rows = 2;

                        textarea.value =
                            item.text;

                        textarea.addEventListener(
                            'input',
                            () => {

                                item.text =
                                    textarea.value;

                                saveData();
                            }
                        );

                        textarea.addEventListener(
                            'blur',
                            () => {

                                if (
                                    textarea.value.trim() !== ''
                                ) {
                                    return;
                                }

                                item.text =
                                    item.defaultText;

                                textarea.value =
                                    item.defaultText;

                                saveData();
                            }
                        );

                        // =================
                        // コピー
                        // =================

                        const copyButton =
                            document.createElement('button');

                        copyButton.type =
                            'button';

                        copyButton.className =
                            `
                            ielovePhraseIconButton
                            ielovePhraseCopy
                            `;

                        copyButton.innerHTML =
                            ICONS.copy;

                        // コピー注釈（カーソルを合わせた瞬間に表示）
                        bindFastTooltip(
                            copyButton,
                            (
                                group.id === 'notice' &&
                                itemIndex === 1
                            )
                                ? '※人が死んだ場合の「HOME\'Sのみ」'
                                : 'コピー'
                        );

                        copyButton.addEventListener(
                            'click',
                            async () => {

                                let text =
                                    textarea.value.trim();

                                if (!text) {

                                    text =
                                        item.defaultText;

                                    item.text =
                                        text;

                                    textarea.value =
                                        text;

                                    saveData();
                                }

                                const success =
                                    await copyText(text);

                                if (!success) {
                                    return;
                                }

                                copyButton.classList.add(
                                    'copied'
                                );

                                setTimeout(
                                    () => {

                                        copyButton
                                            .classList
                                            .remove('copied');

                                    },
                                    700
                                );
                            }
                        );

                        // =================
                        // ↶ デフォルトへ戻す
                        // =================

                        const resetButton =
                            document.createElement('button');

                        resetButton.type =
                            'button';

                        resetButton.className =
                            `
                            ielovePhraseIconButton
                            ielovePhraseReset
                            `;

                        resetButton.innerHTML =
                            ICONS.reset;

                        bindFastTooltip(
                            resetButton,
                            'デフォルト文言に戻す'
                        );

                        resetButton.addEventListener(
                            'click',
                            () => {

                                item.text =
                                    item.defaultText;

                                textarea.value =
                                    item.defaultText;

                                saveData();
                            }
                        );

                        // =================
                        // 🗑 削除
                        // =================

                        const deleteButton =
                            document.createElement('button');

                        deleteButton.type =
                            'button';

                        deleteButton.className =
                            `
                            ielovePhraseIconButton
                            ielovePhraseDelete
                            `;

                        deleteButton.innerHTML =
                            ICONS.delete;

                        bindFastTooltip(
                            deleteButton,
                            'この文言を削除'
                        );

                        deleteButton.addEventListener(
                            'click',
                            () => {

                                const ok =
                                    confirm(
                                        'この文言を削除しますか？'
                                    );

                                if (!ok) {
                                    return;
                                }

                                group.items.splice(
                                    itemIndex,
                                    1
                                );

                                saveData();
                                render();
                            }
                        );

                        const actions =
                            document.createElement('div');

                        actions.className =
                            'ielovePhraseActions';

                        actions.appendChild(
                            defaultButton
                        );

                        actions.appendChild(
                            copyButton
                        );

                        actions.appendChild(
                            resetButton
                        );

                        actions.appendChild(
                            deleteButton
                        );

                        row.appendChild(
                            textarea
                        );

                        row.appendChild(
                            actions
                        );

                        groupElement.appendChild(
                            row
                        );
                    }
                );

                body.appendChild(
                    groupElement
                );
            }
        );
    }

    // =========================================================
    // 開閉
    // =========================================================

    launcher.addEventListener(
        'click',
        () => {

            panel.classList.toggle(
                'open'
            );
        }
    );

    document
        .getElementById('ielovePhraseClose')
        .addEventListener(
            'click',
            () => {

                panel.classList.remove(
                    'open'
                );
            }
        );

    // =========================================================
    // ESC
    // =========================================================

    document.addEventListener(
        'keydown',
        event => {

            if (event.key !== 'Escape') {
                return;
            }

            if (
                modalOverlay
                    .classList
                    .contains('open')
            ) {
                closeModal();
                return;
            }

            panel.classList.remove('open');
        }
    );

    // =========================================================
    // 初期保存・描画
    // =========================================================

    saveData();
    renderTabs();
    render();

})();