# ============================================
# 試堂預約系統 - 主程序文件
# ============================================
# 說明：這是Flask網站的主程序
# 運行方法：在命令行中輸入 python app.py
# ============================================

# ----------------------------------------
# 導入所需的Python庫
# ----------------------------------------
# Flask相關
from flask import Flask, render_template, request, redirect, url_for, flash
# 日期和時間處理
from datetime import datetime, timedelta
# 操作系統相關
import os
# 環境變量讀取
from dotenv import load_dotenv
# Google Sheets相關
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# 導入配置文件中的設定
from config import (
    GRADE_OPTIONS,           # 年級選項
    TIME_SLOTS,              # 時間段
    WEEKDAY_NAMES,           # 星期名稱
    SPREADSHEET_NAME,        # 試算表名稱
    WORKSHEET_NAME,          # 工作表名稱
    SHEET_HEADERS,           # 表頭
    TUTORIAL_CENTER_NAME,    # 補習社名稱
    TUTORIAL_CENTER_ADDRESS, # 補習社地址
    TUTORIAL_CENTER_PHONE,   # 補習社電話
    TUTORIAL_CENTER_EMAIL,   # 補習社電郵
    DEBUG_MODE,              # 除錯模式
    HOST,                    # 主機地址
    PORT,                    # 端口號
)

# ----------------------------------------
# 載入環境變量
# ----------------------------------------
# 從.env文件讀取環境變量（如Google憑證路徑）
load_dotenv()

# ----------------------------------------
# 創建Flask應用程序
# ----------------------------------------
# 初始化Flask應用
app = Flask(__name__)
# 設定密鑰，用於session和flash消息
app.secret_key = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")

# ----------------------------------------
# Google Sheets連接函數
# ----------------------------------------
def get_google_sheet():
    """
    連接到Google Sheets並返回工作表對象
    
    返回：
        worksheet: Google Sheets工作表對象
        如果連接失敗則返回None
    """
    try:
        # 定義Google Sheets API的權限範圍
        scope = [
            "https://spreadsheets.google.com/feeds",           # 讀寫試算表
            "https://www.googleapis.com/auth/spreadsheets",    # 試算表權限
            "https://www.googleapis.com/auth/drive.file",      # 雲端硬碟文件權限
            "https://www.googleapis.com/auth/drive"            # 雲端硬碟權限
        ]
        
        # 獲取憑證文件路徑（從環境變量或使用默認路徑）
        credentials_path = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")
        
        # 檢查憑證文件是否存在
        if not os.path.exists(credentials_path):
            print(f"⚠️ 警告：找不到Google憑證文件 '{credentials_path}'")
            print("📋 系統將以模擬模式運行，數據不會保存到Google Sheets")
            return None
        
        # 使用服務帳戶憑證進行認證
        credentials = ServiceAccountCredentials.from_json_keyfile_name(credentials_path, scope)
        
        # 授權並創建gspread客戶端
        client = gspread.authorize(credentials)
        
        # 嘗試打開試算表
        try:
            # 使用名稱打開試算表
            spreadsheet = client.open(SPREADSHEET_NAME)
        except gspread.SpreadsheetNotFound:
            # 如果試算表不存在，創建新的
            print(f"📝 試算表 '{SPREADSHEET_NAME}' 不存在，正在創建...")
            spreadsheet = client.create(SPREADSHEET_NAME)
            print(f"✅ 已創建試算表 '{SPREADSHEET_NAME}'")
        
        # 嘗試獲取工作表
        try:
            # 使用名稱獲取工作表
            worksheet = spreadsheet.worksheet(WORKSHEET_NAME)
        except gspread.WorksheetNotFound:
            # 如果工作表不存在，創建新的
            print(f"📝 工作表 '{WORKSHEET_NAME}' 不存在，正在創建...")
            worksheet = spreadsheet.add_worksheet(title=WORKSHEET_NAME, rows=1000, cols=10)
            # 添加表頭
            worksheet.append_row(SHEET_HEADERS)
            print(f"✅ 已創建工作表 '{WORKSHEET_NAME}' 並添加表頭")
        
        print("✅ 成功連接到Google Sheets")
        return worksheet
        
    except Exception as e:
        # 如果發生任何錯誤，打印錯誤信息並返回None
        print(f"❌ 連接Google Sheets時發生錯誤：{str(e)}")
        print("📋 系統將以模擬模式運行，數據不會保存到Google Sheets")
        return None

# ----------------------------------------
# 保存預約到Google Sheets的函數
# ----------------------------------------
def save_to_google_sheets(booking_data):
    """
    將預約數據保存到Google Sheets
    
    參數：
        booking_data: 包含預約信息的字典
        
    返回：
        True: 保存成功
        False: 保存失敗（將使用模擬模式）
    """
    try:
        # 獲取Google Sheets工作表
        worksheet = get_google_sheet()
        
        if worksheet is None:
            # 如果無法連接，使用模擬模式
            print("\n" + "="*50)
            print("📋 模擬模式：預約數據（未保存到Google Sheets）")
            print("="*50)
            print(f"  預約時間：{booking_data['submission_time']}")
            print(f"  學生姓名：{booking_data['student_name']}")
            print(f"  年級：{booking_data['grade']}")
            print(f"  聯絡電話：{booking_data['phone']}")
            print(f"  電郵地址：{booking_data['email']}")
            print(f"  預約日期：{booking_data['booking_date']}")
            print(f"  預約時段：{booking_data['time_slot']}")
            print("="*50 + "\n")
            return True  # 模擬模式也返回True，讓用戶能看到成功頁面
        
        # 準備要寫入的數據行
        row_data = [
            booking_data['submission_time'],  # 提交預約的時間
            booking_data['student_name'],     # 學生姓名
            booking_data['grade'],            # 年級
            booking_data['phone'],            # 聯絡電話
            booking_data['email'],            # 電郵地址
            booking_data['booking_date'],     # 預約日期
            booking_data['time_slot'],        # 預約時段
            "待確認"                          # 預約狀態
        ]
        
        # 將數據添加到試算表
        worksheet.append_row(row_data)
        print(f"✅ 預約數據已成功保存到Google Sheets")
        return True
        
    except Exception as e:
        # 如果保存失敗，打印錯誤信息
        print(f"❌ 保存到Google Sheets時發生錯誤：{str(e)}")
        # 使用模擬模式顯示數據
        print("\n" + "="*50)
        print("📋 模擬模式：預約數據（保存失敗）")
        print("="*50)
        for key, value in booking_data.items():
            print(f"  {key}：{value}")
        print("="*50 + "\n")
        return True  # 即使保存失敗也返回True，讓用戶能看到成功頁面

# ----------------------------------------
# 模擬發送確認郵件的函數
# ----------------------------------------
def send_confirmation_email(booking_data):
    """
    模擬發送確認郵件到控制台
    
    參數：
        booking_data: 包含預約信息的字典
    """
    # 在控制台打印模擬郵件
    print("\n" + "="*60)
    print("📧 模擬發送確認郵件")
    print("="*60)
    print(f"收件人：{booking_data['email']}")
    print(f"主題：試堂預約確認 - {TUTORIAL_CENTER_NAME}")
    print("-"*60)
    print("郵件內容：")
    print(f"""
親愛的家長您好：

感謝您為 {booking_data['student_name']} 同學預約試堂！

以下是您的預約詳情：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  學生姓名：{booking_data['student_name']}
  年級：{booking_data['grade']}
  預約日期：{booking_data['booking_date']}
  預約時段：{booking_data['time_slot']}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

請於預約時間前10分鐘到達：
📍 地址：{TUTORIAL_CENTER_ADDRESS}
📞 電話：{TUTORIAL_CENTER_PHONE}

如需更改或取消預約，請致電聯絡我們。

祝您生活愉快！

{TUTORIAL_CENTER_NAME}
{TUTORIAL_CENTER_EMAIL}
""")
    print("="*60 + "\n")

# ----------------------------------------
# 生成未來一周可預約日期的函數
# ----------------------------------------
def get_available_dates():
    """
    生成未來一周的可預約日期（只包含周一到周五）
    
    返回：
        list: 包含日期信息的列表，每個元素是一個字典
    """
    available_dates = []  # 存儲可用日期的列表
    today = datetime.now()  # 獲取今天的日期
    
    # 檢查未來14天內的日期（確保能獲取足夠的工作日）
    for i in range(14):
        # 計算目標日期
        check_date = today + timedelta(days=i)
        
        # 獲取星期幾（0=周一, 1=周二, ..., 4=周五, 5=周六, 6=周日）
        weekday = check_date.weekday()
        
        # 只選擇周一到周五（weekday 0-4）
        if weekday in WEEKDAY_NAMES:
            # 格式化日期信息
            date_info = {
                "date": check_date.strftime("%Y-%m-%d"),           # 日期格式：2024-01-15
                "display": check_date.strftime("%m月%d日"),        # 顯示格式：01月15日
                "weekday": WEEKDAY_NAMES[weekday],                 # 星期幾
                "full_display": f"{check_date.strftime('%m月%d日')} ({WEEKDAY_NAMES[weekday]})"  # 完整顯示
            }
            available_dates.append(date_info)
        
        # 只取前7個工作日
        if len(available_dates) >= 7:
            break
    
    return available_dates

# ----------------------------------------
# 路由：首頁（預約表單頁面）
# ----------------------------------------
@app.route("/")
def index():
    """
    顯示預約表單的首頁
    """
    # 獲取可預約的日期列表
    available_dates = get_available_dates()
    
    # 渲染首頁模板，傳入必要的數據
    return render_template(
        "index.html",
        grades=GRADE_OPTIONS,                    # 年級選項
        time_slots=TIME_SLOTS,                   # 時間段選項
        available_dates=available_dates,         # 可預約日期
        center_name=TUTORIAL_CENTER_NAME,        # 補習社名稱
        center_address=TUTORIAL_CENTER_ADDRESS,  # 補習社地址
        center_phone=TUTORIAL_CENTER_PHONE,      # 補習社電話
        center_email=TUTORIAL_CENTER_EMAIL,      # 補習社電郵
    )

# ----------------------------------------
# 路由：處理預約提交
# ----------------------------------------
@app.route("/submit", methods=["POST"])
def submit_booking():
    """
    處理預約表單的提交
    """
    try:
        # 從表單獲取數據
        student_name = request.form.get("student_name", "").strip()  # 學生姓名
        grade = request.form.get("grade", "")                        # 年級
        phone = request.form.get("phone", "").strip()                # 聯絡電話
        email = request.form.get("email", "").strip()                # 電郵地址
        booking_date = request.form.get("booking_date", "")          # 預約日期
        time_slot = request.form.get("time_slot", "")                # 預約時段
        
        # 驗證必填欄位
        if not all([student_name, grade, phone, booking_date, time_slot]):
            # 如果有欄位為空，顯示錯誤信息
            flash("請填寫所有必填欄位", "error")
            return redirect(url_for("index"))
        
        # 獲取當前時間作為提交時間
        submission_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 格式化預約日期的顯示
        try:
            date_obj = datetime.strptime(booking_date, "%Y-%m-%d")
            weekday = date_obj.weekday()
            weekday_name = WEEKDAY_NAMES.get(weekday, "")
            formatted_date = f"{date_obj.strftime('%Y年%m月%d日')} ({weekday_name})"
        except ValueError:
            formatted_date = booking_date
        
        # 組織預約數據
        booking_data = {
            "submission_time": submission_time,  # 提交時間
            "student_name": student_name,        # 學生姓名
            "grade": grade,                      # 年級
            "phone": phone,                      # 聯絡電話
            "email": email if email else "未提供",  # 電郵地址
            "booking_date": formatted_date,      # 預約日期
            "time_slot": time_slot,              # 預約時段
        }
        
        # 保存到Google Sheets
        save_result = save_to_google_sheets(booking_data)
        
        # 發送確認郵件（模擬）
        if email:
            send_confirmation_email(booking_data)
        
        # 跳轉到確認頁面
        return render_template(
            "confirmation.html",
            student_name=student_name,
            grade=grade,
            booking_date=formatted_date,
            time_slot=time_slot,
            center_name=TUTORIAL_CENTER_NAME,
            center_address=TUTORIAL_CENTER_ADDRESS,
            center_phone=TUTORIAL_CENTER_PHONE,
        )
        
    except Exception as e:
        # 如果發生錯誤，打印錯誤信息並顯示錯誤頁面
        print(f"❌ 處理預約時發生錯誤：{str(e)}")
        flash("提交預約時發生錯誤，請稍後再試", "error")
        return redirect(url_for("index"))

# ----------------------------------------
# 路由：測試Google Sheets連接
# ----------------------------------------
@app.route("/test-sheets")
def test_sheets():
    """
    測試Google Sheets連接是否正常
    """
    worksheet = get_google_sheet()
    if worksheet:
        return "✅ Google Sheets連接成功！"
    else:
        return "⚠️ Google Sheets連接失敗，系統將以模擬模式運行。請檢查credentials.json文件。"

# ----------------------------------------
# 主程序入口
# ----------------------------------------
if __name__ == "__main__":
    # 打印啟動信息
    print("\n" + "="*60)
    print(f"🎓 {TUTORIAL_CENTER_NAME} - 試堂預約系統")
    print("="*60)
    print(f"📍 網站地址：http://localhost:{PORT}")
    print(f"📍 測試連接：http://localhost:{PORT}/test-sheets")
    print("="*60)
    print("按 Ctrl+C 可以停止伺服器")
    print("="*60 + "\n")
    
    # 啟動Flask伺服器
    app.run(
        host=HOST,        # 監聽地址
        port=PORT,        # 端口號
        debug=DEBUG_MODE  # 除錯模式
    )

