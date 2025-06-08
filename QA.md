## 設定步驟

1.  **安裝 OpenSSL (如果尚未安裝):**
    產生 SSL 憑證需要 OpenSSL。如果您的系統中沒有安裝 OpenSSL，或者 `openssl` 指令無法被識別，請先安裝它。
    *   **Windows 使用者:**
        1.  前往 [Shining Light Productions](https://slproweb.com/products/Win32OpenSSL.html) 下載 OpenSSL 安裝程式 (建議下載非 "Light" 的版本，例如 Win64 OpenSSL vX.X.X)。
        2.  執行安裝程式。在安裝過程中，記下安裝路徑 (例如 `C:\Program Files\OpenSSL-Win64`)。
        3.  將 OpenSSL 的 `bin` 目錄 (例如 `C:\Program Files\OpenSSL-Win64\bin`) 加入到您的系統環境變數 `PATH` 中。
            *   在 Windows 搜尋中輸入「環境變數」，選擇「編輯系統環境變數」。
            *   在「系統內容」視窗的「進階」分頁下，點選「環境變數...」。
            *   在「系統變數」區塊中，找到 `Path` 並點選「編輯...」。
            *   點選「新增」，然後貼上 OpenSSL `bin` 目錄的路徑。
            *   點選「確定」儲存變更。
        4.  **重新啟動您的終端機** (例如 PowerShell, 命令提示字元) 以使 `PATH` 變更生效。
        5.  在新的終端機中執行 `openssl version` 來驗證安裝是否成功。
    *   **macOS 使用者:** macOS 通常內建 OpenSSL。如果沒有，可以使用 Homebrew 安裝：`brew install openssl`。
    *   **Linux 使用者:** 大多數 Linux 發行版都內建 OpenSSL。如果沒有，可以使用您的套件管理器安裝 (例如，Debian/Ubuntu: `sudo apt-get install openssl`; Fedora: `sudo dnf install openssl`)。

2.  **安裝相依套件:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **產生 SSL 憑證和金鑰:**
    如果您尚未擁有 `cert.pem` 和 `key.pem` 檔案，請使用 OpenSSL 產生它們。在專案的根目錄下執行以下指令：
    ```bash
    openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
    ```
    執行此指令時，系統會提示您輸入一些憑證資訊 (例如國家、組織名稱等)。您可以依照提示輸入，或直接按 Enter 使用預設值。

4.  **執行 Flask 應用程式:**
    ```bash
    python app.py
    ```
    如果一切設定正確，伺服器將會在 `https://127.0.0.1:5000/` 上啟動。

    由於使用的是自簽名憑證，您的瀏覽器可能會顯示安全警告。您需要接受此警告才能繼續存取頁面。

## 檔案結構

-   `app.py`:主要的 Flask 應用程式檔案。
-   `requirements.txt`: 專案的 Python 相依套件列表。
-   `cert.pem`: SSL 憑證檔案 (產生後)。
-   `key.pem`: SSL 私鑰檔案 (產生後)。
-   `README.md`: 本說明檔案。

## 以下是SSL的app.py參考：
```python
from flask import Flask, send_from_directory, render_template
import os
import ssl

app = Flask(__name__)

# 方法一：直接從根目錄提供 index.html (作為靜態檔案)
@app.route('/')
def index():
    # os.getcwd() 獲取目前工作目錄 (即專案根目錄)
    return send_from_directory(os.getcwd(), 'index.html')

if __name__ == '__main__':
    # --- SSL 設定 ---
    # 選項 A: 使用您先前產生的 cert.pem 和 key.pem
    # 確保 cert.pem 和 key.pem 與 app.py 在同一個目錄，或者提供正確的路徑
    cert_file = 'cert.pem'
    key_file = 'key.pem'

    if not (os.path.exists(cert_file) and os.path.exists(key_file)):
        print(f"錯誤：找不到憑證檔案 '{cert_file}' 或私鑰檔案 '{key_file}'。")
        print("如果您想使用自訂憑證，請確保它們存在。")
        print("或者，您可以考慮使用 Flask 的 'adhoc' SSL 功能 (見下方註解)。")
        # 如果找不到憑證，可以選擇退出或嘗試 'adhoc'
        # exit(1) # 如果強制要求自訂憑證，則取消註解此行

        # 選項 B: 使用 Flask 內建的 'adhoc' SSL (會自動產生臨時憑證)
        # 這對於快速測試很方便，但每次啟動伺服器憑證都會不同。
        print("找不到自訂憑證，嘗試使用 'adhoc' SSL...")
        ssl_context_val = 'adhoc'
    else:
        ssl_context_val = (cert_file, key_file)
        print(f"使用自訂 SSL 憑證: {cert_file}, {key_file}")


    host = '0.0.0.0'  # 監聽所有網路介面
    port = 5000       # HTTPS 埠號

    print(f"正在啟動 Flask HTTPS 伺服器於 https://{host}:{port}")
    print("您可以透過以下方式存取您的 index.html：")
    print(f"  - 本機: https://localhost:{port}/")
    print(f"  - 區域網路 (若防火牆允許): https://<您的區域網路IP>:{port}/")
    print("按下 Ctrl+C 以停止伺服器。")

    try:
        app.run(host=host, port=port, ssl_context=ssl_context_val, debug=True)
    except FileNotFoundError as e:
        # 'adhoc' 在某些環境或舊版 Flask 可能需要額外套件 (如 pyopenssl)
        # 或者如果 cert_file/key_file 路徑仍有問題
        print(f"啟動伺服器時發生錯誤: {e}")
        print("如果您使用的是 'adhoc'，請確保您的 Flask 和相依套件是最新的。")
        print("或者檢查您的憑證檔案路徑是否正確。")
    except ssl.SSLError as e:
        print(f"SSL 錯誤: {e}")
        print("請檢查您的憑證檔案是否有效或密碼是否正確 (如果您設定了密碼)。")
    except Exception as e:
        print(f"發生未知錯誤: {e}")
```