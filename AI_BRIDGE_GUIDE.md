# School Hub AI Bridge ガイド

このガイドでは、Google Apps Script (GAS) に AI (Google Gemini) を導入し、届いた通知メールを自動で要約してスプレッドシートに書き込む方法を説明します。

## 準備するもの
1. **Google Gemini API Key**: [Google AI Studio](https://aistudio.google.com/app/apikey) で無料で取得できます。
2. **個人の Google アカウント**: 大学のアカウントではなく、`@gmail.com` のアカウントで GAS を作成してください。

## 1. スプレッドシートの準備
スプレッドシートの1行目（ヘッダー）を以下のように設定してください。
- A列: `Title`
- B列: `Content`
- C列: `Date`
- D列: `Source`
- E列: `URL`
- F列: `Summary` (← これを追加！)

## 2. GAS コードの書き換え
個人の Google アカウントで GAS プロジェクトを開き、以下のコードに書き換えてください。
`GEMINI_API_KEY` の部分を、取得した自分のキーに書き換えてください。

```javascript
const GEMINI_API_KEY = "あなたのAPIキーをここに貼る";
const SPREADSHEET_ID = "あなたのスプレッドシートID";

function updateSchoolHubSheet() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Sheet1");
  
  // 未読の通知メールを検索（Outlookからの転送などを想定）
  // 検索クエリは必要に応じて調整してください
  const threads = GmailApp.search("is:unread label:school-hub", 0, 10); 
  
  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const msg of messages) {
      if (msg.isUnread()) {
        const title = msg.getSubject();
        const body = msg.getPlainBody();
        const date = msg.getDate();
        
        // AIで要約
        const summary = getAISummary(title, body);
        
        // スプレッドシートに追記
        // 列順: Title, Content, Date, Source, URL, Summary
        sheet.appendRow([
          title, 
          body.substring(0, 1000), // 長すぎるとシートが重くなるので制限
          date, 
          "Outlook", 
          "", 
          summary
        ]);
        
        msg.markRead();
      }
    }
  }
}

function getAISummary(title, body) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + GEMINI_API_KEY;
  
  const prompt = `以下のメール内容を、学生向けに1〜2文で短く要約してください。
重要な日時や提出物があれば必ず含めてください。
言語は日本語で、丁寧な敬語は不要です（「〜です」「〜だ」調でOK）。

件名: ${title}
内容: ${body.substring(0, 2000)}`;

  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    if (json.candidates && json.candidates[0].content.parts[0].text) {
      return json.candidates[0].content.parts[0].text.trim();
    }
  } catch (e) {
    console.error("AI Summary Error: " + e.toString());
  }
  return "要約の生成に失敗しました";
}
```

## 3. トリガーの設定
GAS の画面左側の時計アイコン（トリガー）から、`updateSchoolHubSheet` を「時間主導型」で「1分おき」または「5分おき」に実行するように設定してください。

これで、メールが届くたびに AI が要約し、School Hub の画面にきれいな要約が表示されるようになります。
