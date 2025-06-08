# 網站整體架構

```
|
+-- 瀏覽器 (Client-Side)
    |
    +-- HTML (結構)
    |   |-- templates/
    |       |-- index.html (應用程式主頁面，包含所有 UI 元素)
    |
    +-- CSS (樣式)
    |   |-- static/css/
    |       |-- style.css (RWD 響應式樣式與整體風格)
    |
    +-- JavaScript (邏輯與互動)
        |
        +-- static/js/
            |
            +-- main.js (應用程式入口、初始化、綁定所有事件)
            |
            +-- services/ (負責與後端溝通)
            |   |-- geolocator.js
            |   |   |-- 職責:
            |   |   |   - 透過 `navigator.geolocation` 取得使用者地理座標
            |   |   |   - 呼叫後端 `/api/reverse-geocode` 取得縣市名稱
            |   |
            |   |-- parkingApi.js
            |   |   |-- 職責:
            |   |   |   - 呼叫後端 `/api/query` 進行單一縣市查詢
            |   |   |   - 呼叫後端 `/api/query-all` 進行全國查詢
            |   |
            |   |-- storage.js
            |   |   |-- 職責:
            |   |   |   - 將查詢結果存入 Local Storage
            |   |   |   - 從 Local Storage 讀取歷史資料
            |
            +-- ui/ (使用者介面元件邏輯)
            |   |-- citySelector.js
            |   |   |-- 職責:
            |   |   |   - 動態產生縣市下拉選單
            |   |   |   - 根據地理定位結果設定預設值
            |   |
            |   |-- resultDisplay.js
            |   |   |-- 職責:
            |   |   |   - 將查詢結果動態渲染到頁面上
            |   |   |   - 處理查詢中、查無資料等狀態顯示
            |
            +-- utils/ (共用輔助函式)
                |-- helpers.js (例如：簡化 DOM 操作的函式)

+-- 伺服器 (Server-Side - Flask)
    |
    +-- app.py (主應用程式)
    |   |-- 職責:
    |   |   - 建立 Flask App
    |   |   - 註冊路由
    |   |   - 提供主頁面 `index.html` 及靜態檔案
    |   |   - `/api/reverse-geocode`: 代理 Nominatim API 請求，解決 CORS
    |   |   - `/api/query`: 代理單一縣市停車費 API 請求，解決 CORS
    |   |   - `/api/query-all`: 處理全國停車費查詢邏輯 (含超時與延遲)
    |
    +-- requirements.txt (Python 相依套件)
    |   |-- Flask
    |   |-- requests
    |
    +-- .gitignore
    +-- README.md
    +-- TODO.md
    +-- FRAMEWORK.md
    +-- FLOW.md
``` 