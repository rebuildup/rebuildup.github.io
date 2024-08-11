window.onload = function () {
    // デフォルトのテーマを適用
    document.body.className = 'default';
    var buttons = document.getElementsByTagName('button');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].className = 'default';
    }
};

document.getElementById('copytxt').addEventListener('input', function () {
    // テキストエリアの内容を取得
    var text = this.innerText || this.textContent;

    // 改行文字を除去して文字数を計算
    var textWithoutNewlines = text.replace(/[\r\n]+/g, '');
    var charCount = textWithoutNewlines.length;

    // 文字数を表示
    document.getElementById('charCount').innerText = charCount;
});

// テキストエリアの要素を取得
const textArea = document.querySelector('.txbox');

// ボタンをクリックしたときにテキストエリア内のテキストをクリップボードにコピー
function copyButton(elementId) {
    const element = document.getElementById(elementId);
    navigator.clipboard.writeText(element.innerText);
    var popup = document.getElementById("popup");
    popup.style.visibility = "visible";
    setTimeout(function () {
        popup.style.visibility = "hidden";
    }, 2000);
}

// 設定ポップアップの表示/非表示を切り替え
function toggleSettingsPopup() {
    var popup = document.getElementById("settings-popup");
    var background = document.getElementById("popup-background");
    if (popup.style.display === "none" || popup.style.display === "") {
        popup.style.display = "block";
        background.style.display = "block";
    } else {
        popup.style.display = "none";
        background.style.display = "none";
    }
}

// テキストエリア内の文字数を表示
document.getElementById('copytxt').addEventListener('input', function () {
    // テキストエリアの内容を取得
    var text = this.innerText || this.textContent;

    // 改行文字を除去して文字数を計算
    var textWithoutNewlines = text.replace(/[\r\n]+/g, '');
    var charCount = textWithoutNewlines.length;

    // 改行文字の数をカウント
    var lineBreakCount = (text.match(/[\r\n]/g) || []).length;
    // 行数は改行文字の数 + 1
    var lineCount = lineBreakCount + 1;

    // 文字数と行数を表示
    document.getElementById('charCount').innerText = charCount;
    document.getElementById('lineCount').innerText = lineCount;
});


// フォーカス時にテキストエリアをクリア
document.getElementById('copytxt').addEventListener('focus', function () {
    if (this.innerText === 'テキストを入力する') {
        this.innerText = '';
    }
});

// テーブルを削除
function deleteTable() {
    const table = document.getElementById('texttable');
    table.style.display = 'none';
    if (table) {
        table.parentNode.removeChild(table);
    }
}

// テキストエリアのフォーカスが外れたときにテーブルを作成
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('copytxt');
    const container = document.getElementById('container');
    textarea.addEventListener('blur', () => {
        convertToTable();
    });
});

const textarea = document.getElementById('copytxt');
let timer;

// フォーカス時にテーブルを非表示にし、5秒後にフォーカスを外す
textarea.addEventListener('focus', () => {
    clearTimeout(timer);
    toggleDisplay('texttable', 'none');
    timer = setTimeout(() => {
        textarea.blur();
    }, 5000); // 5秒後にフォーカスを外す
});

// キー入力時にタイマーをリセットし、5秒後にフォーカスを外す
textarea.addEventListener('keydown', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
        textarea.blur();
    }, 5000);
});

// テキストをテーブルに変換
async function convertToTable() {
    let content = document.getElementById('copytxt').innerHTML;
    const tableContainer = document.getElementById('tableContainer');
    tableContainer.innerHTML = ''; // 以前のテーブルをクリア

    // HTML タグをテキストに変換
    content = content.replace(/<div>/gi, '\n')
        .replace(/<\/div>/gi, '')
        .replace(/<br\s*\/?>/gi, ' ');

    const positions = await fetchWordPositions(content);

    const table = document.createElement('table');
    table.id = "texttable";
    table.style.borderCollapse = 'collapse';
    let row = document.createElement('tr');

    let position = 0;

    content.split('\n').forEach(line => {
        for (let char of line) {
            const cell = document.createElement('td');
            cell.style.border = '1px solid #000';
            cell.style.padding = '5px';
            cell.innerText = char;

            const currentPosition = position;

            // セルクリック時にテキストエリアにキャレットを移動
            cell.addEventListener('click', function () {
                toggleDisplay('textcontent', 'block');
                document.getElementById('copytxt').focus();
                setTimeout(() => {
                    moveCaretToPosition('copytxt', currentPosition - countLineBreaksUpToPosition(content, currentPosition) + 1);
                }, 1); // テーブル描画後にキャレット移動
            });

            // マウスオーバーでセルをハイライト
            cell.addEventListener('mouseover', function () {
                const table = document.getElementById('texttable');
                const cells = table.getElementsByTagName('td');

                // セル位置に基づいて単語の範囲をハイライト
                const filteredPositions = positions.filter(([start, end]) =>
                    currentPosition >= start && currentPosition <= end
                );

                filteredPositions.forEach(([start, end]) => {
                    const lineBreaksBefore = content.slice(0, start).split('\n').length - 1;
                    for (let i = start; i <= end; i++) {
                        const correctedIndex = i - lineBreaksBefore;
                        if (correctedIndex >= 0 && correctedIndex < cells.length) {
                            cells[correctedIndex].style.backgroundColor = 'yellow';
                        }
                    }
                });
            });

            // マウスアウト時にハイライトを解除
            cell.addEventListener('mouseout', function () {
                highlightCell('texttable', -1);
            });

            row.appendChild(cell);
            position++;
        }
        table.appendChild(row);
        row = document.createElement('tr'); // 新しい行を作成
        position++; // 改行文字を考慮
    });

    toggleDisplay('textcontent', 'none');
    tableContainer.appendChild(table);
}

// サーバーから単語の位置を取得
async function fetchWordPositions(text) {
    const response = await fetch('/word_positions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });
    return await response.json();
}

// テーブルのセルをハイライト
function highlightCell(tableId, cellIndex, highlightColor = 'yellow') {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`テーブルが見つかりません: ${tableId}`);
        return;
    }

    const cells = table.getElementsByTagName('td');

    if (cellIndex === -1) {
        for (let cell of cells) {
            cell.style.backgroundColor = ''; // ハイライト解除
        }
        return;
    }

    if (cellIndex < 0 || cellIndex >= cells.length) {
        console.error(`指定されたインデックスが範囲外です: ${cellIndex}`);
        return;
    }

    for (let cell of cells) {
        cell.style.backgroundColor = ''; // ハイライト解除
    }

    cells[cellIndex].style.backgroundColor = highlightColor;
}

// 要素の表示/非表示を切り替え
function toggleDisplay(elementId, displayState) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = displayState;
    }
}

// 指定位置にキャレットを移動
function moveCaretToPosition(elementId, position) {
    const memo = document.getElementById(elementId);
    if (!memo) {
        console.error(`要素が見つかりません: ${elementId}`);
        return;
    }

    const range = document.createRange();
    const selection = window.getSelection();
    let charCount = 0;
    let node = null;

    function traverseNodes(nodes) {
        for (let i = 0; i < nodes.length; i++) {
            const currentNode = nodes[i];
            if (currentNode.nodeType === Node.TEXT_NODE) {
                const textLength = currentNode.textContent.length;
                if (charCount + textLength >= position) {
                    node = currentNode;
                    range.setStart(currentNode, position - charCount);
                    return true;
                } else {
                    charCount += textLength;
                }
            } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
                if (traverseNodes(currentNode.childNodes)) {
                    return true;
                }
            }
        }
        return false;
    }

    traverseNodes(memo.childNodes);

    if (!node) {
        node = memo.lastChild;
        range.selectNodeContents(node);
        range.collapse(false);
    }

    selection.removeAllRanges();
    selection.addRange(range);
    memo.focus();
}

// テキストエリアの末尾にキャレットを移動
function moveCaretToEnd(textareaId) {
    const memo = document.getElementById(textareaId);
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(memo);
    range.collapse(false); // 末尾に移動
    selection.removeAllRanges();
    selection.addRange(range);
}

function countLineBreaksUpToPosition(content, position) {
    // 指定位置までの文字列を取り出す
    const textUpToPosition = content.slice(0, position);

    // 改行記号の数をカウントする
    const lineBreakCount = (textUpToPosition.match(/\n/g) || []).length;

    return lineBreakCount;
}
