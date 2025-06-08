import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning

# 停用 InsecureRequestWarning 警告
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

from flask import Flask, render_template, request, jsonify
import time
import os
import ssl

app = Flask(__name__)

# 各縣市停車費 API URLs
CITY_APIS = {
    "臺北市": "https://trafficapi.pma.gov.taipei/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "新北市": "https://trafficapi.traffic.ntpc.gov.tw/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "基隆市": "https://park.klcg.gov.tw/TrafficPayBill/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "桃園市": "https://bill-epark.tycg.gov.tw/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "新竹市": "https://his.futek.com.tw:5443/TrafficPayBill/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "新竹縣": "https://hcpark.hchg.gov.tw/NationalParkingPayBillInquiry/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "苗栗縣": "https://miaoliparking.jotangi.com.tw/TrafficPayBill/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "臺中市": "http://tcparkingapi.taichung.gov.tw:8081/NationalParkingPayBillInquiry.Api/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "彰化縣": "https://chpark.chcg.gov.tw/TrafficPayBill/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "雲林縣": "https://parking.yunlin.gov.tw/TrafficPayBill/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "嘉義市": "https://parking.chiayi.gov.tw/cypark/api/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "嘉義縣": "https://8voc0wuf1g.execute-api.ap-southeast-1.amazonaws.com/default/chiayi/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "臺南市": "http://parkingbill.tainan.gov.tw/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "高雄市": "https://kpp.tbkc.gov.tw/parking/V1/parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "屏東縣": "https://8voc0wuf1g.execute-api.ap-southeast-1.amazonaws.com/default/pingtung/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "南投縣": "https://parking.nantou.gov.tw/TrafficPayBill/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "宜蘭縣": "https://billparking.e-land.gov.tw/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "花蓮縣": "https://hl.parchere.com.tw/TrafficPayBill/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "臺東縣": "https://tt.guoyun.com.tw/TrafficPayBill/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "金門縣": "https://km.guoyun.com.tw/TrafficPayBill/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
    "澎湖縣": "https://apparking.penghu.gov.tw/TrafficPayBill/Parking/PayBill/CarID/{CarID}/CarType/{CarType}",
}

@app.route("/")
def index():
    cities = list(CITY_APIS.keys())
    return render_template("index.html", cities=cities)

@app.route("/api/query", methods=["POST"])
def query_parking_fee():
    data = request.json
    city = data.get('city')
    car_id = data.get('carId')
    car_type = data.get('carType')

    if not all([city, car_id, car_type]):
        return jsonify({"error": "缺少必要參數：city, carId, carType"}), 400

    if city not in CITY_APIS:
        return jsonify({"error": f"不支援的縣市：{city}"}), 400

    api_url = CITY_APIS[city].format(CarID=car_id, CarType=car_type)
    
    try:
        # 將逾時時間從 2 秒延長到 5 秒
        response = requests.get(api_url, timeout=5, verify=False) 
        response.raise_for_status()
        # 某些API即使成功也可能回傳非JSON內容，這裡多做一層保護
        if 'application/json' in response.headers.get('Content-Type', ''):
            return jsonify(response.json())
        else:
            return jsonify({"error": f"{city}: API未回傳有效的JSON資料"}), 500
    except requests.exceptions.Timeout:
        return jsonify({"error": f"{city}: 查詢逾時"}), 504 # Gateway Timeout
    except requests.exceptions.RequestException as e:
        # The API might return non-JSON error pages, so we send back a generic error
        return jsonify({"error": f"{city}: 查詢時發生錯誤: {e}"}), 500

@app.route("/api/reverse-geocode")
def reverse_geocode():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    if not lat or not lon:
        return jsonify({"error": "Missing lat/lon parameters"}), 400
    
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&accept-language=zh-TW"
    # Nominatim API 需要一個獨特的 User-Agent 來識別應用程式，以符合其使用政策
    headers = {
        'User-Agent': 'ParkingFeeChecker/1.0 (A web app to check parking fees)'
    }
    try:
        # 增加自訂 headers 和 verify=False
        response = requests.get(url, timeout=5, verify=False, headers=headers)
        response.raise_for_status() # 如果狀態碼是 4xx 或 5xx，將會引發 HTTPError
        data = response.json()
        city = data.get("address", {}).get("city")
        if not city:
            # Handle cases like "county" for some areas
            city = data.get("address", {}).get("county")

        if city:
            return jsonify({"city": city})
        else:
            return jsonify({"error": "Could not determine city"}), 404
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # --- SSL 設定 ---
    cert_file = 'cert.pem'
    key_file = 'key.pem'

    # 檢查憑證和金鑰是否存在
    if not (os.path.exists(cert_file) and os.path.exists(key_file)):
        print(f"錯誤：找不到憑證檔案 '{cert_file}' 或私鑰檔案 '{key_file}'。")
        print("將嘗試使用 Flask 的 'adhoc' SSL 功能 (會自動產生臨時憑證)。")
        print("對於正式部署，建議使用自簽或有效的 SSL 憑證。")
        ssl_context_val = 'adhoc'
    else:
        ssl_context_val = (cert_file, key_file)
        print(f"成功載入自訂 SSL 憑證: {cert_file}, {key_file}")
    
    host = '127.0.0.1'
    port = 5000
    
    print(f"正在啟動 Flask HTTPS 伺服器於 https://{host}:{port}")
    print("當瀏覽器顯示安全警告時，請選擇「繼續前往」或「接受風險」。")

    try:
        app.run(host=host, port=port, ssl_context=ssl_context_val, debug=True)
    except Exception as e:
        print(f"啟動伺服器時發生錯誤: {e}") 