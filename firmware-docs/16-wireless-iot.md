# 16. 無線通訊與 IoT 系統

> **一句話**：IoT 韌體 = **感測 + 無線 + 雲端 + 安全 + OTA**。這是軟體工程師轉韌體**最好的切入點**，因為一半的知識（MQTT、雲端、API、資安）你已經會了。

---

## 1. 無線技術總覽 🟢

| 技術 | 距離 | 速率 | 功耗 | 拓撲 | 典型應用 |
|---|---|---|---|---|---|
| **BLE** | 10～100m | 1～2 Mbps | 極低 | 星狀 / Mesh | 穿戴、醫療、手機配件、Beacon |
| **Wi-Fi** | 50m | 數十 Mbps ～ Gbps | 高 | 星狀 | 家電、攝影機 |
| **Thread** | 數十 m | 250 kbps | 低 | Mesh（IPv6） | 智慧家庭（Matter） |
| Zigbee | 數十 m | 250 kbps | 低 | Mesh | 智慧家庭（舊有） |
| **LoRa / LoRaWAN** | 2～15 km | 0.3～50 kbps | 極低 | 星狀（經閘道器） | 農業、抄表、資產追蹤 |
| **NB-IoT / LTE-M** | 蜂巢網路 | 數十 kbps ～ 1Mbps | 低 | 電信網路 | 智慧電表、追蹤器 |
| **5G RedCap** | 蜂巢網路 | 中 | 中 | 電信網路 | 工業、穿戴（較新） |
| **UWB** | 10～50m | — | 低 | — | **精確定位（公分級）**、數位車鑰匙 |
| NFC | 數 cm | 低 | 極低 | 點對點 | 配對、支付 |
| Sub-GHz 專有協定 | 中 | 低 | 低 | — | 遙控器、警報器 |

## 2. BLE（低功耗藍牙）🟡

### 2.1 協定堆疊

```
Application
├── GATT（Generic Attribute Profile）：Service / Characteristic
├── ATT（Attribute Protocol）
├── GAP（Generic Access Profile）：廣播、掃描、連線、角色
├── L2CAP / SMP（安全配對）
├── HCI（Host 與 Controller 介面）
└── Link Layer / PHY（1M、2M、Coded PHY 長距離）
```

### 2.2 核心概念

| 概念 | 說明 |
|---|---|
| **角色** | Peripheral（廣播、被連線，如手環）/ Central（掃描、發起連線，如手機） |
| **廣播（Advertising）** | 週期性發送封包，可攜帶少量資料（Beacon） |
| **GATT 結構** | Service（如 Heart Rate）→ Characteristic（如測量值）→ Descriptor（如 CCCD） |
| UUID | 16-bit（SIG 標準）或 128-bit（自訂） |
| 操作 | Read、Write、Write Without Response、**Notify**（不需確認）、**Indicate**（需確認） |
| **連線參數** | Connection Interval（7.5ms～4s）、Peripheral Latency、Supervision Timeout → **影響功耗與延遲** |
| MTU | 預設 23 bytes（有效資料 20），可協商到 247 以上；搭配 Data Length Extension 提升吞吐 |
| 配對 / 綁定 | Just Works、Passkey、Numeric Comparison、OOB；**LE Secure Connections**（ECDH） |

### 2.3 新功能

- **LE Audio / Auracast**（BT 5.2+）：LC3 編碼、廣播音訊
- **Channel Sounding**（BT 6.0，2024）：安全的精確測距
- BLE Mesh：大量節點組網（照明）

### 2.4 主流 BLE 晶片

**Nordic nRF52 / nRF53 / nRF54**（業界標竿，nRF Connect SDK 基於 Zephyr）、TI CC26xx、Silicon Labs EFR32、**ESP32 系列**（Wi-Fi + BLE）、Infineon/Cypress、Realtek、Telink。

## 3. Wi-Fi 🟡

- 模式：**Station（連 AP）**、**SoftAP（自己當 AP，用於配網）**、AP+STA
- 配網（Provisioning）方式：SoftAP 網頁、**BLE 配網**、SmartConfig、QR Code、**Matter commissioning**
- 安全：WPA2-PSK → **WPA3**；企業版 802.1X/EAP
- **Wi-Fi 6（802.11ax）**：TWT 讓 IoT 裝置可協商睡眠時間，大幅省電
- **Wi-Fi HaLow（802.11ah）**：Sub-GHz、長距離低功耗
- 晶片：**ESP32 系列**（最普及）、Infineon CYW43（Raspberry Pi Pico W）、Realtek、NXP、TI

## 4. Matter 與 Thread（智慧家庭新標準）🔴

**Matter**：由 CSA（Connectivity Standards Alliance，原 Zigbee 聯盟）與 Apple、Google、Amazon、Samsung 共同推動的**應用層統一標準**。

| 特點 | 說明 |
|---|---|
| 基於 IP | 跑在 **Wi-Fi、Thread、Ethernet** 上 |
| 跨平台 | 一個裝置同時支援 Apple Home、Google Home、Alexa、SmartThings |
| 配網 | 透過 BLE commissioning + QR Code |
| 安全 | 裝置證明憑證（DAC）、PKI |
| 多管理者 | Multi-Admin：多個生態系同時控制 |
| 開源 SDK | connectedhomeip（GitHub） |

**Thread**：基於 IEEE 802.15.4 的低功耗 **IPv6 Mesh 網路**，透過 **Border Router**（如 HomePod、Nest Hub）連接到 IP 網路。

## 5. LPWAN 🟡

| | LoRaWAN | NB-IoT | LTE-M |
|---|---|---|---|
| 頻段 | 免授權 Sub-GHz（台灣 AS923） | 授權頻段 | 授權頻段 |
| 網路 | 自建閘道器或公共網路（TTN） | 電信業者 | 電信業者 |
| 移動性 | 有限 | 差 | **支援換手、語音** |
| 費用 | 無月租（自建） | SIM 月租 | SIM 月租 |
| 應用 | 農業、園區 | 固定式表計 | 追蹤器、穿戴 |

## 6. IoT 應用層協定 🟡

| 協定 | 傳輸 | 模式 | 特點 |
|---|---|---|---|
| **MQTT** | TCP（+TLS） | **發佈/訂閱**，經 Broker | IoT 主流；QoS 0/1/2；Retained、Last Will；**MQTT 5** 增加原因碼、使用者屬性、共享訂閱 |
| MQTT-SN | UDP 等 | 發佈/訂閱 | 給非 TCP 網路（感測網路） |
| **CoAP** | UDP（+DTLS） | 類 REST | 輕量，適合受限裝置；Observe 機制；**LwM2M** 建於其上（裝置管理） |
| HTTP/REST | TCP | 請求/回應 | 簡單但較重 |
| WebSocket | TCP | 雙向 | 即時 |
| **LwM2M** | CoAP | 裝置管理 | 標準化物件模型、OTA、遠端設定（電信 IoT 常見） |

### 6.1 MQTT 重點（對應你的 MQ 經驗）

| 概念 | 說明 |
|---|---|
| Topic | 階層式：`factory/line1/sensor42/temp`，萬用字元 `+`（單層）、`#`（多層） |
| QoS 0 | 最多一次（不確認） |
| QoS 1 | **至少一次**（可能重複，接收端要冪等） |
| QoS 2 | 恰好一次（四次交握，成本高） |
| Retained | Broker 保留最後一筆，新訂閱者立刻取得 |
| **Last Will（LWT）** | 裝置異常斷線時 Broker 代發訊息 → 偵測離線 |
| Keep Alive | 心跳 |
| Clean Session / Session Expiry | 離線期間是否保留訂閱與訊息 |
| Broker | Mosquitto、EMQX、HiveMQ、雲端（AWS IoT Core、Azure IoT Hub） |

## 7. IoT 系統架構 🔴

```
裝置（MCU + 感測器）
   │ BLE / Thread / LoRa
   ▼
閘道器（Linux）── 邊緣運算、協定轉換、本地快取
   │ MQTT over TLS / HTTPS
   ▼
雲端 IoT 平台：裝置註冊、身分驗證、Device Shadow / Twin、規則引擎
   │
   ├─▶ 訊息佇列（Kafka）→ 時序資料庫 → 儀表板 / 分析 / AI
   └─▶ OTA 服務、裝置管理、告警
```

| 雲端概念 | 說明 |
|---|---|
| **裝置身分** | 每台裝置唯一的 **X.509 憑證**（mTLS），而非共用密碼 |
| **Device Shadow / Twin** | 雲端保存裝置的期望狀態與回報狀態，裝置離線時也能下指令 |
| **配發（Provisioning）** | 工廠燒錄身分 → 首次上線自動註冊（Just-in-Time / Fleet Provisioning） |
| 批次 OTA | 分群、分階段推送、監控失敗率、自動暫停（類似金絲雀部署） |
| 時序資料庫 | InfluxDB、TimescaleDB（**PostgreSQL 擴充**） |

## 8. RF 與天線基本常識 🟡

- **RSSI**：接收訊號強度（dBm，-50 很好、-90 很差）
- dBm：0 dBm = 1mW；每 +3dB 功率加倍；每 +10dB 功率 ×10
- 天線擺放、金屬外殼、人體會嚴重影響距離
- 產品上市需要**法規認證**：台灣 NCC、美國 FCC、歐盟 CE（RED）、藍牙 SIG 認證；使用**已認證模組**可降低成本

---

## 面試常問

### Q1. BLE 與 Classic Bluetooth 差在哪？

BLE 為低功耗短資料傳輸設計：連線快、大部分時間睡眠、以 GATT 屬性模型交換資料；Classic（BR/EDR）適合連續串流（傳統藍牙耳機、SPP）。兩者實體層與協定不同，雙模晶片可同時支援。LE Audio 正讓 BLE 也能做音訊。

### Q2. 說明 GATT 的 Service / Characteristic。

Service 是一組相關功能的集合（如電池服務），Characteristic 是其中的資料點（如電量），每個有 UUID、屬性（Read/Write/Notify）與值；Descriptor 描述 Characteristic，其中 **CCCD** 讓 Central 開啟或關閉 Notify/Indicate。

### Q3. BLE Notify 與 Indicate 的差別？

Notify 不需要接收方確認，吞吐量高；Indicate 需要應用層確認，較可靠但慢（每次只能有一個未確認的 Indicate）。

### Q4. 如何提高 BLE 傳輸速率？

使用 2M PHY、增加 ATT MTU（247）、開啟 Data Length Extension、縮短 Connection Interval、使用 Write Without Response / Notify、每個連線事件傳送多個封包。

### Q5. MQTT 的 QoS 等級？如何偵測裝置離線？

QoS 0/1/2 見 6.1。離線偵測：Keep Alive 逾時 + **Last Will**；裝置上線時發布 retained 的 `online` 狀態，LWT 設定為 retained 的 `offline`。

### Q6. 為什麼 IoT 裝置要用 X.509 憑證而不是共用密碼？

每台裝置有獨立身分，單一裝置被破解不影響其他裝置、可個別撤銷；搭配 mTLS 雙向驗證；私鑰可存於安全元件（Secure Element）無法被讀出。共用密碼一旦外洩，整批裝置都會被冒用。

### Q7. LoRaWAN 與 NB-IoT 如何選擇？

需要自建網路、無月租、園區/農場、極低功耗 → LoRaWAN。需要廣域覆蓋、不想管基礎設施、電信級可靠度 → NB-IoT；需要移動性或較高速率 → LTE-M。

### Q8. 什麼是 Matter？解決什麼問題？

智慧家庭的統一應用層標準，解決各生態系互不相容的問題：裝置只要支援 Matter，即可被 Apple、Google、Amazon 等平台同時控制。底層使用 IP（Wi-Fi、Thread、Ethernet），以 BLE 配網，內建 PKI 安全機制。

## 過時技術（知道就好）

- **Zigbee（新設計）**：智慧家庭新產品多轉向 Thread + Matter（Zigbee 仍有大量既有安裝基礎）。
- **2G/3G IoT 模組**：各國電信陸續關閉 2G/3G 網路，應改用 LTE-M / NB-IoT。
- **Sigfox**：營運公司 2022 年破產重整，市場地位大幅下降。

## 本章回顧

- 短距低功耗 → BLE；高速 → Wi-Fi；智慧家庭 → Thread + Matter；長距離 → LoRaWAN / NB-IoT
- BLE：GAP 管連線、GATT 管資料；連線參數決定功耗
- MQTT：QoS、Retained、LWT —— 和你熟悉的 MQ 同一套思維
- 裝置身分用 X.509 + mTLS；雲端用 Device Shadow 與分批 OTA
