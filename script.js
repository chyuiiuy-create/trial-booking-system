/* ============================================
   試堂預約系統 - JavaScript文件
   ============================================
   說明：這個文件處理表單提交和數據發送
   數據會發送到Google Apps Script並保存到Google Sheets
   部署平台：Cloudflare Pages
   ============================================ */

// ========================================
// 配置區域 - 請在這裡填入您的Google Apps Script URL
// ========================================

// 【重要】請將下面的URL替換為您的Google Apps Script網址
// 如果您還沒有設置，請參考README.md中的說明
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

// ========================================
// 星期名稱對照表（中文）
// ========================================
const WEEKDAY_NAMES = {
    0: '星期日',
    1: '星期一',
    2: '星期二',
    3: '星期三',
    4: '星期四',
    5: '星期五',
    6: '星期六'
};

// ========================================
// 頁面載入完成後執行
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // 初始化日期選項
    initializeDateOptions();
    
    // 初始化電話號碼格式化
    initializePhoneFormatter();
    
    // 初始化表單提交
    initializeFormSubmit();
});

// ========================================
// 生成未來一周的可預約日期
// ========================================
function initializeDateOptions() {
    // 獲取日期選擇下拉框
    const dateSelect = document.getElementById('booking_date');
    
    // 如果找不到元素，直接返回（可能在確認頁面）
    if (!dateSelect) return;
    
    // 獲取今天的日期
    const today = new Date();
    
    // 存儲可用日期的數量
    let availableDates = 0;
    
    // 檢查未來14天內的日期
    for (let i = 0; i < 14 && availableDates < 7; i++) {
        // 計算目標日期
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        
        // 獲取星期幾（0=周日, 1=周一, ..., 6=周六）
        const weekday = checkDate.getDay();
        
        // 只選擇周一到周五（weekday 1-5）
        if (weekday >= 1 && weekday <= 5) {
            // 格式化日期
            const year = checkDate.getFullYear();
            const month = String(checkDate.getMonth() + 1).padStart(2, '0');
            const day = String(checkDate.getDate()).padStart(2, '0');
            
            // 日期值（用於提交）
            const dateValue = `${year}-${month}-${day}`;
            
            // 顯示文字
            const displayText = `${month}月${day}日 (${WEEKDAY_NAMES[weekday]})`;
            
            // 創建選項元素
            const option = document.createElement('option');
            option.value = dateValue;
            option.textContent = displayText;
            
            // 添加到下拉框
            dateSelect.appendChild(option);
            
            // 增加計數
            availableDates++;
        }
    }
}

// ========================================
// 電話號碼自動格式化
// ========================================
function initializePhoneFormatter() {
    // 獲取電話輸入框
    const phoneInput = document.getElementById('phone');
    
    // 如果找不到元素，直接返回
    if (!phoneInput) return;
    
    // 監聽輸入事件
    phoneInput.addEventListener('input', function(e) {
        // 移除非數字字符
        let value = e.target.value.replace(/\D/g, '');
        
        // 限制最多8位數字
        value = value.substring(0, 8);
        
        // 格式化為 XXXX XXXX
        if (value.length > 4) {
            value = value.substring(0, 4) + ' ' + value.substring(4);
        }
        
        // 更新輸入框的值
        e.target.value = value;
    });
}

// ========================================
// 顯示提示訊息
// ========================================
function showAlert(message, type) {
    // 獲取提示容器
    const alertContainer = document.getElementById('alert-container');
    
    // 如果找不到容器，直接返回
    if (!alertContainer) return;
    
    // 創建提示元素
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // 清空之前的提示
    alertContainer.innerHTML = '';
    
    // 添加新提示
    alertContainer.appendChild(alert);
    
    // 5秒後自動隱藏
    setTimeout(function() {
        alert.style.opacity = '0';
        setTimeout(function() {
            alert.remove();
        }, 300);
    }, 5000);
}

// ========================================
// 初始化表單提交
// ========================================
function initializeFormSubmit() {
    // 獲取表單元素
    const form = document.getElementById('booking-form');
    
    // 如果找不到表單，直接返回
    if (!form) return;
    
    // 監聽表單提交事件
    form.addEventListener('submit', function(event) {
        // 阻止表單默認提交行為
        event.preventDefault();
        
        // 獲取提交按鈕
        const submitBtn = document.getElementById('submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnIcon = submitBtn.querySelector('.btn-icon');
        
        // 獲取表單數據
        const studentName = document.getElementById('student_name').value.trim();
        const grade = document.getElementById('grade').value;
        const subject = document.getElementById('subject').value;
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const bookingDate = document.getElementById('booking_date').value;
        const timeSlot = document.getElementById('time_slot').value;
        
        // 驗證必填欄位
        if (!studentName || !grade || !subject || !phone || !bookingDate || !timeSlot) {
            showAlert('請填寫所有必填欄位', 'error');
            return;
        }
        
        // 驗證電話號碼格式
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 8) {
            showAlert('請輸入有效的香港電話號碼（8位數字）', 'error');
            return;
        }
        
        // 顯示載入狀態
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        btnIcon.textContent = '⏳';
        btnText.textContent = '處理中...';
        
        // 格式化預約日期顯示
        const dateObj = new Date(bookingDate);
        const weekday = dateObj.getDay();
        const formattedDate = `${dateObj.getFullYear()}年${String(dateObj.getMonth() + 1).padStart(2, '0')}月${String(dateObj.getDate()).padStart(2, '0')}日 (${WEEKDAY_NAMES[weekday]})`;
        
        // 準備提交的數據
        const formData = {
            timestamp: new Date().toLocaleString('zh-HK'),
            studentName: studentName,
            grade: grade,
            subject: subject,
            phone: phone,
            email: email || '未提供',
            bookingDate: formattedDate,
            timeSlot: timeSlot,
            status: '待確認'
        };
        
        // 保存到本地存儲（供管理頁面顯示）
        saveToLocalStorage(formData);
        
        // 檢查是否已設置Google Apps Script URL
        if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            // 未設置URL，使用模擬模式
            console.log('========================================');
            console.log('📋 模擬模式：預約數據');
            console.log('========================================');
            console.log('提交時間：', formData.timestamp);
            console.log('學生姓名：', formData.studentName);
            console.log('年級：', formData.grade);
            console.log('科目：', formData.subject);
            console.log('聯絡電話：', formData.phone);
            console.log('電郵地址：', formData.email);
            console.log('預約日期：', formData.bookingDate);
            console.log('預約時段：', formData.timeSlot);
            console.log('========================================');
            console.log('⚠️ 請在script.js中設置GOOGLE_SCRIPT_URL以啟用數據保存到Google Sheets');
            console.log('========================================');
            
            // 延遲1秒後跳轉到確認頁面（模擬網絡請求）
            setTimeout(function() {
                redirectToConfirmation(studentName, grade, subject, formattedDate, timeSlot);
            }, 1000);
            
        } else {
            // 已設置URL，發送數據到Google Apps Script
            sendToGoogleSheets(formData, function(success) {
                if (success) {
                    // 成功，跳轉到確認頁面
                    redirectToConfirmation(studentName, grade, subject, formattedDate, timeSlot);
                } else {
                    // 失敗，顯示錯誤
                    showAlert('提交失敗，請稍後再試', 'error');
                    
                    // 恢復按鈕狀態
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('loading');
                    btnIcon.textContent = '✓';
                    btnText.textContent = '確認預約';
                }
            });
        }
    });
}

// ========================================
// 發送數據到Google Sheets（通過Google Apps Script）
// ========================================
function sendToGoogleSheets(data, callback) {
    // 使用fetch API發送POST請求
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script需要no-cors模式
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(function() {
        // no-cors模式下無法讀取響應，假設成功
        console.log('✅ 數據已發送到Google Sheets');
        callback(true);
    })
    .catch(function(error) {
        // 發生錯誤
        console.error('❌ 發送數據時發生錯誤：', error);
        callback(false);
    });
}

// ========================================
// 跳轉到確認頁面
// ========================================
function redirectToConfirmation(name, grade, subject, date, time) {
    // 構建URL參數
    const params = new URLSearchParams({
        name: name,
        grade: grade,
        subject: subject,
        date: date,
        time: time
    });
    
    // 跳轉到確認頁面
    window.location.href = 'confirmation.html?' + params.toString();
}

// ========================================
// 保存預約數據到本地存儲（供管理頁面查看）
// ========================================
function saveToLocalStorage(bookingData) {
    try {
        // 獲取現有的預約記錄
        const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        
        // 添加新的預約到開頭
        existingBookings.unshift(bookingData);
        
        // 只保留最近的50條記錄
        const trimmedBookings = existingBookings.slice(0, 50);
        
        // 保存到本地存儲
        localStorage.setItem('bookings', JSON.stringify(trimmedBookings));
        
        console.log('✅ 預約數據已保存到本地存儲');
    } catch (error) {
        console.error('❌ 保存到本地存儲時發生錯誤：', error);
    }
}

