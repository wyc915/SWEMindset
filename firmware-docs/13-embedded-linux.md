# 13. 嵌入式 Linux 與驅動程式

> **一句話**：當裝置需要網路、圖形介面、檔案系統或大量運算時，就會用跑 Linux 的 SoC。韌體工程師需要懂**開機鏈、Device Tree、核心驅動、建置系統**。

---

## 1. MCU 韌體 vs 嵌入式 Linux 🟢

| | MCU + 裸機/RTOS | 嵌入式 Linux |
|---|---|---|
| 硬體 | Cortex-M、KB～MB RAM | Cortex-A / RISC-V（有 MMU）、數十 MB～GB DRAM |
| 開機時間 | ms 級 | 秒級（可優化至 1～2 秒） |
| 即時性 | 硬即時 | 一般為軟即時；**PREEMPT_RT 已在 Linux 6.12 併入主線**，可達更低延遲 |
| 記憶體保護 | MPU（可選） | MMU：行程隔離 |
| 開發 | 單一映像檔 | Bootloader + Kernel + Rootfs + 應用 |
| 生態 | 原廠 SDK | 網路、Python、容器、資料庫等全套 |
| 職稱 | 韌體工程師 | BSP 工程師、Linux 驅動工程師、嵌入式軟體工程師 |

**常見混合架構**：Linux 處理 UI 與網路、旁邊一顆 MCU（或同 SoC 內的 Cortex-M 核心）處理即時控制，透過 **RPMsg / OpenAMP** 通訊（如 NXP i.MX8M、STM32MP1/MP2、TI AM62）。

## 2. 開機鏈 🟡

```
Boot ROM ─▶ SPL / TF-A BL2 ─▶ (TF-A BL31 + OP-TEE) ─▶ U-Boot ─▶ Linux Kernel ─▶ init (systemd) ─▶ App
```

| 階段 | 工作 |
|---|---|
| Boot ROM | 晶片內建，依 boot 腳位從 eMMC/SD/SPI NOR/USB 載入下一階段，可驗證簽章 |
| SPL / BL2 | 初始化 **DRAM**（之前只能用內部 SRAM） |
| TF-A BL31 | ARMv8 安全監控（EL3），提供 PSCI 電源管理 |
| OP-TEE | TrustZone 中的可信執行環境（TEE） |
| **U-Boot** | 初始化周邊、載入 Kernel / DTB / initramfs、支援網路開機、A/B 切換 |
| **Kernel** | 解壓、初始化子系統、依 Device Tree 探測驅動、掛載 rootfs |
| init | 啟動服務 |

## 3. Device Tree（裝置樹）🟡

**問題**：ARM SoC 種類太多，過去每塊板子都要在核心原始碼寫死硬體資訊。

**解法**：用一份**描述硬體的資料檔**（.dts），編譯成 .dtb 由 Bootloader 傳給核心，**同一份核心映像可支援多種板子**。

```dts
&i2c1 {
    status = "okay";
    clock-frequency = <400000>;

    temp_sensor: sensor@48 {
        compatible = "ti,tmp102";     /* 驅動透過 compatible 字串匹配 */
        reg = <0x48>;                 /* I²C 位址 */
        interrupt-parent = <&gpio1>;
        interrupts = <5 IRQ_TYPE_EDGE_FALLING>;
    };
};
```

| 名詞 | 說明 |
|---|---|
| `.dts` / `.dtsi` | 板子描述 / 共用（SoC 層級）描述 |
| `compatible` | 驅動與節點的匹配字串 |
| `reg` | 位址（記憶體映射位址或匯流排位址） |
| `status` | `"okay"` 啟用 / `"disabled"` 停用 |
| **Device Tree Overlay** | 執行時套用的補丁，如樹莓派擴充板 |

> **Zephyr RTOS 也使用 Device Tree**，學一次兩邊都能用。

## 4. Linux 驅動程式 🔴

### 4.1 User Space vs Kernel Space

| | User Space | Kernel Space |
|---|---|---|
| 權限 | 受限 | 完整硬體存取 |
| 錯誤影響 | 行程崩潰 | **整個系統 Kernel Panic** |
| 記憶體 | 虛擬位址、可 swap | 核心位址，不可隨意睡眠的情境多 |
| 溝通 | 系統呼叫（`open/read/write/ioctl/mmap`） | — |

### 4.2 驅動類型

| 類型 | 說明 | 例子 |
|---|---|---|
| **Character Device** | 以位元組流存取，`/dev/xxx` | UART、感測器、自訂裝置 |
| **Block Device** | 以區塊存取，有快取 | eMMC、SD |
| **Network Device** | 透過 socket 存取，無 `/dev` 節點 | Ethernet、Wi-Fi |

### 4.3 Linux 驅動模型

```
Bus（匯流排：platform / i2c / spi / usb / pci）
 ├── Device（裝置：由 Device Tree 或自動列舉產生）
 └── Driver（驅動：宣告支援哪些 compatible）
        bus 負責配對 → 呼叫 driver 的 probe()
```

最小 platform driver 骨架：

```c
static int mydev_probe(struct platform_device *pdev) {
    /* 取得資源：devm_ioremap_resource、devm_request_irq、devm_clk_get ... */
    return 0;
}
static const struct of_device_id mydev_of_match[] = {
    { .compatible = "acme,mydev" }, { }
};
MODULE_DEVICE_TABLE(of, mydev_of_match);

static struct platform_driver mydev_driver = {
    .probe  = mydev_probe,
    .driver = { .name = "mydev", .of_match_table = mydev_of_match },
};
module_platform_driver(mydev_driver);
MODULE_LICENSE("GPL");
```

### 4.4 重要子系統與框架

| 子系統 | 用途 |
|---|---|
| **GPIO / pinctrl** | 腳位控制（user space 用 **libgpiod**；舊的 `/sys/class/gpio` 已棄用） |
| **IIO** | 感測器、ADC |
| **regmap** | 統一 I²C/SPI 暫存器存取 |
| input | 按鍵、觸控 |
| DRM/KMS | 顯示 |
| V4L2 | 相機 |
| ALSA / ASoC | 音訊 |
| MTD / UBI / UBIFS | Raw NAND/NOR Flash |
| netdev | 網路 |
| **devm_*** | 資源自動管理，驅動卸載時自動釋放 |

### 4.5 核心內的同步與延遲處理

| 機制 | 可睡眠 | 用途 |
|---|---|---|
| spinlock | ❌ | 中斷上下文、短臨界區 |
| mutex | ✅ | 行程上下文 |
| atomic_t | — | 計數 |
| RCU | — | 讀多寫少 |
| softirq / tasklet | ❌ | 下半部（tasklet 逐漸被取代） |
| **workqueue** | ✅ | 下半部，可睡眠 |
| **threaded IRQ** | ✅ | 現代推薦的中斷下半部 |

**在中斷上下文中不能睡眠**：不能呼叫 `mutex_lock`、`msleep`、`kmalloc(GFP_KERNEL)`、`copy_to_user`。

## 5. 建置系統 🟡

| 工具 | 特性 | 適用 |
|---|---|---|
| **Buildroot** | 簡單、快速、Makefile + Kconfig，產生精簡 rootfs | 小型產品、快速原型 |
| **Yocto Project / OpenEmbedded** | 彈性極高、layer 架構（meta-xxx）、recipe（.bb）、**產生 SBOM（SPDX）** | **業界產品主流**，原廠 BSP 多以 Yocto 提供 |
| Debian / Ubuntu Core | 完整發行版 | 閘道器、開發 |
| **Android / AOSP** | 消費電子、車機（Android Automotive） | — |

## 6. 儲存與檔案系統 🟡

| 檔案系統 | 用途 |
|---|---|
| ext4 | eMMC / SD 一般用途 |
| **SquashFS** | 唯讀壓縮 rootfs（搭配 overlayfs 可寫層） |
| UBIFS | Raw NAND |
| JFFS2 | 小型 NOR（較舊） |
| tmpfs | RAM 暫存 |

**MCU 上的檔案系統**：**LittleFS**（斷電安全、磨損平均，Zephyr/Mbed 採用）、FatFs（SD 卡相容）。

**唯讀 rootfs + A/B 更新**是產品化的最佳實踐，避免斷電損毀。

## 7. OTA 更新方案（Linux）🔴

| 工具 | 特性 |
|---|---|
| **SWUpdate** | A/B 或救援模式、簽章、Yocto 整合 |
| **RAUC** | A/B、簽章、bundle |
| **Mender** | 完整 OTA 平台（伺服器 + 用戶端） |
| OSTree | 類 Git 的檔案系統版本管理，增量更新 |

## 8. 除錯工具 🟡

| 工具 | 用途 |
|---|---|
| `dmesg` | 核心日誌 |
| `printk` / `dev_info` / `pr_debug`（dynamic debug） | 驅動日誌 |
| `/proc`、`/sys`、debugfs | 核心狀態 |
| `strace`、`ltrace` | 系統呼叫追蹤 |
| `gdb` / `gdbserver` | 遠端除錯 |
| **ftrace、perf、eBPF** | 效能與追蹤 |
| `i2cdetect`、`i2cget`、`spidev_test` | 匯流排測試 |
| KGDB、JTAG | 核心除錯 |
| `kdump` | 核心崩潰傾印 |

---

## 面試常問

### Q1. 說明嵌入式 Linux 的開機流程。

見第 2 節：Boot ROM → SPL（初始化 DRAM）→ U-Boot → Kernel（解析 DTB、probe 驅動、掛載 rootfs）→ init → 應用。

### Q2. 什麼是 Device Tree？為什麼需要？

見第 3 節。重點：把硬體描述與核心程式碼分離，同一份核心可支援多種板子；驅動透過 `compatible` 字串匹配。

### Q3. User space 與 kernel space 如何溝通？

系統呼叫（`read/write/ioctl`）、`mmap`（映射核心記憶體或硬體暫存器到使用者空間，零複製）、sysfs / procfs / debugfs、netlink socket、`poll/select/epoll` 等待事件、UIO / VFIO（使用者空間驅動）。

### Q4. 字元裝置驅動要實作哪些函式？

`file_operations`：`open`、`release`、`read`、`write`、`unlocked_ioctl`、`poll`、`mmap`。並使用 `copy_to_user` / `copy_from_user` 在核心與使用者空間間複製資料（不可直接解參考使用者指標）。

### Q5. spinlock 與 mutex 的差別？

spinlock 忙碌等待、**不可睡眠**，用於中斷上下文與極短臨界區，取得時會關閉搶佔（`spin_lock_irqsave` 另會關閉本地中斷）。mutex 取不到時讓出 CPU 進入睡眠，只能用於行程上下文，適合較長的臨界區。

### Q6. Linux 中斷的上半部與下半部？

上半部（hardirq）立即執行、盡量短、不可睡眠；下半部延後處理耗時工作：softirq、tasklet、workqueue（可睡眠）、threaded IRQ（`request_threaded_irq`，現代推薦）。

### Q7. Yocto 與 Buildroot 如何選擇？

Buildroot 簡單快速，適合單一產品、小團隊；Yocto 學習曲線高但可擴展性、可重用 layer、套件管理、SBOM 與授權合規輸出完整，是多產品線與商業 BSP 的業界主流。

### Q8. 什麼是 PREEMPT_RT？

讓 Linux 核心幾乎所有部分都可被搶佔（spinlock 轉為可睡眠的 rt_mutex、中斷執行緒化），大幅降低最壞延遲，讓 Linux 可用於工業控制等軟/韌即時應用。已於 **Linux 6.12（2024）併入主線**。

## 過時技術（知道就好）

- **Board File（arch/arm/mach-xxx/board-xxx.c）**：Device Tree 之前寫死硬體資訊的方式。
- **sysfs GPIO（`/sys/class/gpio`）**：已棄用，改用 libgpiod 與 GPIO character device。
- **JFFS2、YAFFS2**：新設計多改用 UBIFS 或 eMMC + ext4。
- **tasklet**：逐漸被 workqueue 與 threaded IRQ 取代。

## 本章回顧

- 開機鏈：ROM → SPL → U-Boot → Kernel → init
- Device Tree 描述硬體，`compatible` 匹配驅動
- 驅動模型：bus / device / driver → probe
- 中斷上下文不能睡眠；spinlock vs mutex
- 產品主流：Yocto + 唯讀 rootfs + A/B OTA（SWUpdate / RAUC / Mender）
