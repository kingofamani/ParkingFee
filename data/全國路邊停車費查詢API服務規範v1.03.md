全國路邊停車費查詢

API 服務規範

### 文件版本：第 1 版

### 標準編號：V 1

### 研擬單位：交通部

### 提出日期：中華民國 111 年 03 月


```
I
```
### 版本 日期 說明 撰寫人員

### V1.0 111. 03. 01 第一版 王國琛、顏吉男

### V1.01 1 11.05.

### 取消選填設計，統一規定所有欄位皆

### 須輸出，而無資料之輸出準則如下：

### 陣列欄位 => 輸出 [] 空陣列

### 字串欄位 => 輸出 "" 空字串

### 相關修正：

### 1 .取消下列選填欄位設定

```
Reminders陣列欄位
IsProsecuted 數字欄位
ProsecuteLimitDate字串欄位
2 .json輸出範例,補充"Bills":[]
與 "Reminders":[]之空陣列輸出
3 .json輸出範例, 於Reminder中
多輸出IsProsecuted與
ProsecuteLimitDate兩個欄位
4.無告發時,欄位填列方式為:
"IsProsecuted":0,
"ProsecuteLimitDate":"",
5.API Response新增欄位型別
```
### 王國琛、顏吉男

### V1.0 2 1 11.05.2 7 新增JSON輸出「欄位型別」 王國琛、顏吉男

### V1.03 1 11.0 6. 08

```
Result回傳為一個Object非陣列
故無值應回傳null
```
### 王國琛、顏吉男


## II

- 壹、 緣起................................................................................................................
- 貳、 目的................................................................................................................
- 參、 API規範
- 肆、 API說明
- 伍、 API錯誤代碼表
- 陸、 API HTTP狀態代碼表
- 柒、 附錄..............................................................................................................


```
I
```
## 壹、 緣起................................................................................................................

本部為解決民眾開車跨區出差/旅遊時，累積過多停車繳費單未

繳時，需要快速跨縣市區域查詢之痛點，爰訂定本規範，以利全國

有統一的標準遵循，並同時提供規格一致的API服務查詢介面，方

便加值業者開發更能解決民眾需求之貼心生活應用服務。

## 貳、 目的................................................................................................................

本規範之主要目的如下：

1. 規範全國統一的停車費查詢API服務介面。
2. 促進交通數位便民服務之產業應用發展。

## 參、 API規範

依據本規範開發之API介面需符合下列要求：

 程式介面

採用REST API，讓資料使用者可以HTTP GET方式取得資料。

 傳輸規格

採用HTTP 1.1規範進行資料交換，格式以json為主。

 編碼方式

資料編碼方式一律採用UTF- 8 編碼。

 查詢逾時(Timeout)時間

每次查詢均不得超過 2 秒。


 節流機制(Throttling)

為確保Open API之效能與安全，每秒單一IP限制呼叫次數不

得超過 1 次。

 政策遵循

應符合國發會「共通性應用程式介面規範」，提供符合國際

Open API Specification(OAS)標準文件與API使用介面。

## 肆、 API說明

 服務名稱

取得指定「車號」及「車種」之待繳停車費紀錄。

 服務使用提醒

受限於不同繳費方式(如：超商臨櫃繳費)的清帳作業流程，可

能會有民眾臨櫃繳費後，立即查詢此服務但仍有顯示待繳停車

費紀錄之情形。

 服務網址(URI)

../Parking/PayBill/CarID/{CarID}/CarType/{CarType}

 輸入參數(API Request)

```
參數代碼 參數型別 參數名稱 備註
```
```
CarID String 車號
```
### 車牌號碼

### 如：AJH- 6023 、軍C-

### 21110

```
CarType String 車種
```
### C：汽車

### M：機車

### O：其他(如拖車)

### *車牌號碼需考量特種車牌如: 軍/使/臨/外/試 等中文字元


 回傳訊息(API Response)

回應訊息，格式為json
欄位英文名稱 欄位型別 欄位中文名稱 備註
Status String 回傳狀態 1.若查詢成功則回傳SUCCESS
2.若查詢失敗則回傳錯誤代碼。
錯誤代碼請參考柒、錯誤代碼表
Message String 回傳訊息 描述此次查詢的狀態。如：查詢
成功、查詢失敗
Result Object 回傳訊息 查詢成功時，回傳路邊待繳停車
費記錄
*灰色底色欄位為Optional(非必填欄位)，其餘欄位必填

```
Result的詳細內容，格式為json
欄位英文名稱 欄位型別 欄位中文名稱 備註
CarID String 車號 車牌號碼
如：AJH- 6023 、軍C-
21110
CarType String 車種 C：汽車
M：機車
O：其他
TotalCount Number 繳費單總筆數
(停車單數+催繳
單數)
```
### 停車單：停車單未逾

### 期的狀態，一筆表一

### 單

### 催繳單：若有停車單

### 已逾期，將轉換成催

### 繳單，而一筆催繳單

### 可能合併多筆逾期的

### 停車單

```
TotalAmount Number 繳費單總金額 停車單應繳總金額+
催繳單應繳總金額
Bills Array 停車單資訊 包絡多筆
當停車單為[未逾期]
或[已逾期但轉催繳
中](即尚未產生催繳
單號)時填列
Bill Object 停車單資料 單筆
Reminders Array 催繳單資訊 包絡多筆
```

### 若已產生催繳單時為

### 必填

### 若無催繳單請輸出空

### 陣列

Reminder Object 催繳單資料 單筆
CityCode String 停車縣市代碼 詳附錄一、城市代碼
表(國際ISO 3166-2)
AuthorityCode String 業管機關代碼 詳附錄二、業管機關
代碼表
UpdateTime String 資料更新時間 時間格式採ISO
格式
(yyyy-MM-
ddTHH:mm:sszzz)
例: 2017- 05 -
03T17:30:08+08:
*灰色底色欄位為Optional(非必填欄位)，其餘欄位必填
*UpdateTime資料更新時間，建議統一提供此次API查詢/回傳的時間

Bill的詳細內容，格式為json

```
欄位英文名稱 欄位型別 欄位中文名稱 備註
BillNo String^ 停車單號^ 停車繳費單號^
如：STBG09BAE
ParkingDate String^ 停車日期^ YYYY-MM-DD^
PayLimitDate String 繳費期限 停車單的繳費期限
YYYY-MM-DD
BillStatus Number 停車單狀態 0 :未逾期；
1:逾期轉催繳中；
2:催繳；
3:告發
ParkingHours Number 停車時數 單位:小時^
若屬「計時」停車格
之開單，則該欄位值
需大於 0 ；
若屬「計次」停車格
之開單，因停車時數
無法估計，建議提供
```
- 1(表示無資料)
Amount Number 停車金額 (單位:元)
PayAmount Number 應繳金額 (單位:元)


### 未逾期停車單之停車

### 金額應等於應繳金額

Reminder的詳細內容，格式為json

```
欄位英文名稱 欄位型別 欄位中文名稱 備註
ReminderNo String^ 催繳單號^
ReminderLimitD
ate
```
```
String 催繳期限 催繳單的繳費期限
YYYY-MM-DD
Amount Number^ 催繳單之停車
總金額
```
### 催繳單內所含單筆/多

### 筆已逾期停車單之停

### 車費金額加總

### (單位:元)

```
ExtraCharge Number^ 催繳單開立之
其他衍生費用
```
### 含開立該催繳單之工

### 本費

### (單位:元)

### (工本費僅會在

```
Reminder之
ExtraCharge列示，而
Bill之Amount及
PayAmount僅有停車費
金額。以新北市為
例，路邊停車費逾期
未繳費之停車單，係
將一週逾期未繳之停
車單匯整為 1 筆補繳
通知單，每筆補繳通
知單僅收一筆工本費)
PayAmount Number^ 催繳單之應繳
總金額
```
### 停車金額+其他衍生費

### 用

```
Bills Array^ 催繳單所含的
已逾期停車單
資訊
```
### 包絡多筆

```
Bill Object^ 催繳單所含的
已逾期停車單
資料
```
### 單筆

```
(催繳單內停車單Bill
結構中的BillStatus
需為 2 ，因為已經催
繳)
IsProsecuted Number^ 告發狀態^ 如經催繳後仍未依限
繳納停車費，會依法
開單告發
0 :無告發(預設值)；
1 :已告發
```

### 如[無告發]請輸出 0

```
ProsecuteLimit
Date
```
String 告發期限 告發單的繳費期限
YYYY-MM-DD
當[告發狀態=1(已告
發)]時，才需要填
如[尚未告發]請輸出
空字串
* 催繳單(Reminder)中提供已逾期停車單(Bill)資料之主要目的是，為了讓
民眾(車主)了解催繳單是由哪些停車單合併轉成的。
*灰色底色欄位為Optional(非必填欄位)，其餘欄位必填

API範例 **：**

```
輸入參數：{車號}= AJH-6023; {車種}=C
```
```
API網址：http://.../Parking/PayBill/CarID/AJH- 6023 /CarType/C
```
(1)查詢成功

情境(A) **：** 無待繳停車費紀錄

```
{
“Status”: “SUCCESS”,
“Message”:”查詢成功”,
“Result”: null
}
```
情境(B)：有待繳停車費紀錄，且單純為停車繳費單之情況

```
{
“Status”: “SUCCESS”,
“Message”:”查詢成功”,
“Result”:{
“CarID”:”AJH-6023”,
“CarType”:”C”,
“TotalCount”: 2 ,
“TotalAmount”: 280 ,
“Bills”:[
{
“BillNo”:”VNB4810M8746”,
“ParkingDate”:”2021- 12 - 25”,
```

```
“PayLimitDate”:”2022- 01 - 25”,
“BillStatus”:0,
“ParkingHours”: 1,
“Amount”: 80,
“PayAmount”: 80
},
{
“BillNo”:”JKOP3N18941N”,
“ParkingDate”:”2021- 12 - 26”,
“PayLimitDate”:”2022- 01 - 26”,
“BillStatus”:0,
“ParkingHours”: 3,
“Amount”: 200,
“PayAmount”: 200
}
],
“Reminders”:[],
“CityCode”:”NWT”,
“AuthorityCode”:”NWT”,
“UpdateTime”:”2021- 12 - 28T11:05:39+08:00”,
}
}
```
情境(C)：有待繳停車費紀錄，但同時有停車繳費單與

催繳單之情況

```
{
“Status”: “SUCCESS”,
“Message”:”查詢成功”,
“Result”:{
“CarID”:”AJH-6023”,
“CarType”:”C”,
“TotalCount”: 4 ,
“TotalAmount”: 2620 ,
“Bills”:[
{
“BillNo”:”VNB4810M8746”,
“ParkingDate”:”2021- 12 - 25”,
```

“PayLimitDate”:”2022- 01 - 25”,
“BillStatus”:0,
“ParkingHours”: 1,
“Amount”: 80,
“PayAmount”: 80
},
{
“BillNo”:”JKOP3N18941N”,
“ParkingDate”:”2021- 12 - 26”,
“PayLimitDate”:”2022- 01 - 26”,
“BillStatus”:0,
“ParkingHours”: 3,
“Amount”: 200,
“PayAmount”: 200
}
],
“Reminders”:[
{
“ReminderNo”:”101008521”,
“ReminderLimitDate”:”2021- 12 - 15”,
“Amount”:590,
“ExtraCharge”:190,
“PayAmount”:780,
“Bills”:[
{
“BillNo”:”ZB1B3K01341”,
“ParkingDate”:”2021- 09 - 03”,
“PayLimitDate”:”2022- 10 - 15”,
“BillStatus”: 2 ,
“ParkingHours”: 2.5,
“Amount”: 240,
“PayAmount”: 2 40
},
{
“BillNo”:”L61081551523145”,
“ParkingDate”:”2021- 08 - 27”,
“PayLimitDate”:”2022- 10 - 03”,
“BillStatus”: 2 ,


“ParkingHours”: 3.5,
“Amount”: 350,
“PayAmount”: 350
}
],
“IsProsecuted”:1,
“ProsecuteLimitDate”:”2021- 12 - 26”
},
{
“ReminderNo”:”102006712”,
“ReminderLimitDate”:”2021- 12 - 31”,
“Amount”:1380,
“ExtraCharge”:180,
“PayAmount”:1560,
“Bills”:[
{
“BillNo”:”VNB4810M8746”,
“ParkingDate”:”2021- 10 - 25”,
“PayLimitDate”:”2022- 11 - 30”,
“BillStatus”: 2 ,
“ParkingHours”: 8,
“Amount”: 1200,
“PayAmount”: 1 200
},
{
“BillNo”:”JKOP3N18941N”,
“ParkingDate”:”2021- 10 - 11”,
“PayLimitDate”:”2022- 11 - 20”,
“BillStatus”: 2 ,
“ParkingHours”: 1.5,
“Amount”: 180,
“PayAmount”: 180
}
],
“IsProsecuted”: 0 ,
“ProsecuteLimitDate”:””
}
],


```
“CityCode”:”NWT”,
“AuthorityCode”:”NWT”,
“UpdateTime”:”2021- 12 - 28T11:05:39+08:00”
}
}
```
情境(D)：有待繳停車費紀錄，且僅有停車催繳單之情況

{
“Status”: “SUCCESS”,
“Message”:”查詢成功”,
“Result”:{
“CarID”:”AJH-6023”,
“CarType”:”C”,
“TotalCount”: 2 ,
“TotalAmount”: 2340 ,
“Bills”:[],
“Reminders”:[
{
“ReminderNo”:”101008521”,
“ReminderLimitDate”:”2021- 12 - 15”,
“Amount”:590,
“ExtraCharge”:190,
“PayAmount”:780,
“Bills”:[
{
“BillNo”:”ZB1B3K01341”,
“ParkingDate”:”2021- 09 - 03”,
“PayLimitDate”:”2022- 10 - 15”,
“BillStatus”: 2 ,
“ParkingHours”: 2.5,
“Amount”: 240,
“PayAmount”: 2 40
},
{
“BillNo”:”L61081551523145”,
“ParkingDate”:”2021- 08 - 27”,
“PayLimitDate”:”2022- 10 - 03”,


“BillStatus”: 2 ,
“ParkingHours”: 3.5,
“Amount”: 350,
“PayAmount”: 350
}
],
“IsProsecuted”:1,
“ProsecuteLimitDate”:”2021- 12 - 26”
},
{
“ReminderNo”:”102006712”,
“ReminderLimitDate”:”2021- 12 - 31”,
“Amount”:1380,
“ExtraCharge”:180,
“PayAmount”:1560,
“Bills”:[
{
“BillNo”:”VNB4810M8746”,
“ParkingDate”:”2021- 10 - 25”,
“PayLimitDate”:”2022- 11 - 30”,
“BillStatus”: 2 ,
“ParkingHours”: 8,
“Amount”: 1200,
“PayAmount”: 1 200
},
{
“BillNo”:”JKOP3N18941N”,
“ParkingDate”:”2021- 10 - 11”,
“PayLimitDate”:”2022- 11 - 20”,
“BillStatus”: 2 ,
“ParkingHours”: 1.5,
“Amount”: 180,
“PayAmount”: 180
}
],
“IsProsecuted”: 0 ,
“ProsecuteLimitDate”:””
}


### ],

```
“CityCode”:”NWT”,
“AuthorityCode”:”NWT”,
“UpdateTime”:”2021- 12 - 28T11:05:39+08:00”,
}
}
```
( 2 )查詢失敗

```
{
“Status”: “ERR01”,
“Message”:”查詢失敗” ,
“Result”: null
}
```

## 伍、 API錯誤代碼表

 當API參數未輸入或輸入格式/代碼有誤時，需輸出相對應錯

誤代碼如下表所示

```
錯誤代碼 錯誤名稱 定義 備註
ERR0 1 未輸入查詢參數
```
### 未輸入所有查詢

### 參數時

### 所有查詢參數皆

### 需輸入

### ERR0 2 輸入車牌格式有誤

### 輸入英數字、中

### 文字及「-」以外

### 之符號

### ERR03 輸入車種代碼有誤

### 輸入「C」、「M」、

### 「Ｏ」以外之代

### 碼

## 陸、 API HTTP狀態代碼表

 來源伺服器端必需回應之狀態資訊如下表所示

```
HTTP
Status Code
```
### 英文描述 中文描述

```
400 Bad Request 來源平台認定有誤。
401 Unauthorized 來源平台未授權。^
403 Forbidden 來源平台拒絕存取。
404 Not Found 於來源平台找不到資源。
429 Too Many
Requests
```
### 使用者在給定的時間內傳送了

### 太多的請求。同一來源IP每

### 秒呼叫次數不得超過 1 次。

```
500 Internal Server
Error
```
### 來源平台伺服器錯誤。

```
502 Bad Gateway 來源平台在作為閘道或 Proxy
時收到無效的回應。
503 Service
Unavailable
```
### 來源平台暫時無法處理請求。


## 柒、 附錄..............................................................................................................

城市與業管機關簡碼均採國際ISO 3166- 2 三碼城市代碼。

一、城市簡碼(CityCode)對照表

```
縣市 簡碼(Code) 縣市 簡碼(Code)
臺北市 TPE 南投縣 NAN
新北市 NWT 雲林縣 YUN
桃園市 TAO 嘉義縣 CYQ
臺中市 TXG 嘉義市 CYI
臺南市 TNN 屏東縣 PIF
高雄市 KHH 宜蘭縣 ILA
基隆市 KEE 花蓮縣 HUA
新竹市 HSZ 臺東縣 TTT
新竹縣 HSQ 金門縣 KIN
苗栗縣 MIA 澎湖縣 PEN
彰化縣 CHA 連江縣 LIE
```
二、業管機關簡碼(AuthorityCode)對照表

```
業管機關名稱 AuthorityCode 業管機關名稱 AuthorityCode
臺北市政府 TPE 南投縣政府 NAN
新北市政府 NWT 雲林縣政府 YUN
桃園市政府 TAO 嘉義縣政府 CYQ
臺中市政府 TXG 嘉義市政府 CYI
臺南市政府 TNN 屏東縣政府 PIF
高雄市政府 KHH 宜蘭縣政府 ILA
基隆市政府 KEE 花蓮縣政府 HUA
新竹市政府 HSZ 臺東縣政府 TTT
新竹縣政府 HSQ 金門縣政府 KIN
苗栗縣政府 MIA 澎湖縣政府 PEN
彰化縣政府 CHA 連江縣政府 LIE
```

