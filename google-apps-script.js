/* ============================================
   Google Apps Script - 試堂預約系統後端
   ============================================
   
   功能：
   1. 接收預約數據並保存到 Google Sheets
   2. 更新預約狀態（確認/拒絕）
   3. 發送確認/拒絕郵件
   
   【使用說明】
   1. 打開 Google Sheets，創建一個名為「試堂預約記錄」的試算表
   2. 在試算表中，點擊「擴充功能」→「Apps Script」
   3. 刪除編輯器中的所有代碼
   4. 複製以下全部代碼並貼上
   5. 點擊「部署」→「新增部署」
   6. 選擇「網頁應用程式」
   7. 設定：
      - 執行身分：我
      - 誰可以存取：所有人
   8. 點擊「部署」
   9. 複製生成的網址，貼到 script.js 中的 GOOGLE_SCRIPT_URL
   
   ============================================ */

// ========================================
// 補習社資訊（請根據需要修改）
// ========================================
const CENTER_NAME = '香港質心教育';
const CENTER_ADDRESS = '九龍太子彌敦道761號太子藍馬之城3樓B室（太子地鐵站C1出口）';
const CENTER_PHONE = '5765 1008';
const CENTER_EMAIL = 'info@hkquality.edu.hk'; // 發件人顯示的名稱
const ADMIN_EMAIL = 'zhangyu01@eduzhixin.com'; // 管理員電郵地址（接收新預約通知）

// ========================================
// 處理POST請求（接收預約數據）
// ========================================
function doPost(e) {
  try {
    // 解析接收到的JSON數據
    var data = JSON.parse(e.postData.contents);
    
    // 根據操作類型處理
    if (data.action === 'confirm') {
      return confirmBooking(data);
    } else if (data.action === 'decline') {
      return declineBooking(data);
    } else {
      return saveNewBooking(data);
    }
    
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        'status': 'error',
        'message': error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// 保存新預約
// ========================================
function saveNewBooking(data) {
  // 獲取當前的試算表
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  
  // 檢查是否需要添加表頭
  if (sheet.getRange('A1').getValue() === '') {
    sheet.appendRow([
      '預約ID',
      '提交時間',
      '學生姓名',
      '年級',
      '科目',
      '聯絡電話',
      '電郵地址',
      '希望日期',
      '希望時段',
      '確認日期',
      '確認時段',
      '狀態',
      '備註'
    ]);
    
    // 設置表頭樣式
    var headerRange = sheet.getRange('A1:M1');
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4a86e8');
    headerRange.setFontColor('#ffffff');
  }
  
  // 添加新的預約記錄
  sheet.appendRow([
    data.id || '',              // 預約ID
    data.timestamp || '',       // 提交時間
    data.studentName || '',     // 學生姓名
    data.grade || '',           // 年級
    data.subject || '',         // 科目
    data.phone || '',           // 聯絡電話
    data.email || '',           // 電郵地址
    data.preferredDate || '',   // 希望日期
    data.preferredTime || '',   // 希望時段
    '',                         // 確認日期（待填）
    '',                         // 確認時段（待填）
    data.status || '待處理',    // 狀態
    ''                          // 備註
  ]);
  
  // 發送新預約通知給管理員
  sendAdminNotification(data);
  
  return ContentService
    .createTextOutput(JSON.stringify({
      'status': 'success',
      'message': '預約已成功記錄'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 發送新預約通知給管理員
// ========================================
function sendAdminNotification(data) {
  var emailSubject = '【新預約】' + data.studentName + ' - ' + data.subject;
  
  var typeText = '';
  if (data.type === 'cancel') {
    typeText = '❌ 取消預約申請';
  } else if (data.type === 'change') {
    typeText = '🔄 更改預約申請';
  } else {
    typeText = '📝 新試堂預約';
  }
  
  var emailBody = typeText + '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    '📋 預約詳情：\n\n' +
    '  預約ID：' + (data.id || '無') + '\n' +
    '  提交時間：' + (data.timestamp || '無') + '\n' +
    '  學生姓名：' + (data.studentName || '無') + '\n' +
    '  年級：' + (data.grade || '無') + '\n' +
    '  科目：' + (data.subject || '無') + '\n' +
    '  聯絡電話：' + (data.phone || '無') + '\n' +
    '  電郵地址：' + (data.email || '未提供') + '\n' +
    '  希望日期/時段：' + (data.preferredDate || '無') + '\n\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    '請登入管理後台處理此預約：\n' +
    'https://trial-booking-system.pages.dev/admin.html\n\n' +
    CENTER_NAME + ' 預約系統';
  
  try {
    MailApp.sendEmail(ADMIN_EMAIL, emailSubject, emailBody);
    Logger.log('新預約通知已發送至管理員：' + ADMIN_EMAIL);
  } catch (error) {
    Logger.log('發送管理員通知失敗：' + error.toString());
  }
}

// ========================================
// 確認預約
// ========================================
function confirmBooking(data) {
  // 獲取試算表
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  
  // 查找對應的預約（根據ID）
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === data.bookingId) {
      // 更新確認日期、確認時段和狀態
      sheet.getRange(i + 1, 10).setValue(data.confirmedDate);  // J列：確認日期
      sheet.getRange(i + 1, 11).setValue(data.confirmedTime);  // K列：確認時段
      sheet.getRange(i + 1, 12).setValue('已確認');             // L列：狀態
      
      // 發送確認郵件
      if (values[i][6] && values[i][6] !== '未提供') {
        sendConfirmationEmail(
          values[i][6],  // 電郵
          values[i][2],  // 學生姓名
          values[i][3],  // 年級
          values[i][4],  // 科目
          data.confirmedDate,
          data.confirmedTime
        );
      }
      
      break;
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      'status': 'success',
      'message': '預約已確認，郵件已發送'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 拒絕預約
// ========================================
function declineBooking(data) {
  // 獲取試算表
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  
  // 查找對應的預約（根據ID）
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === data.bookingId) {
      // 更新狀態和備註
      sheet.getRange(i + 1, 12).setValue('已拒絕');          // L列：狀態
      sheet.getRange(i + 1, 13).setValue(data.reason || ''); // M列：備註
      
      // 發送拒絕郵件
      if (values[i][6] && values[i][6] !== '未提供') {
        sendDeclineEmail(
          values[i][6],  // 電郵
          values[i][2],  // 學生姓名
          data.reason
        );
      }
      
      break;
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      'status': 'success',
      'message': '預約已拒絕，通知已發送'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 發送確認郵件
// ========================================
function sendConfirmationEmail(email, studentName, grade, subject, date, time) {
  var emailSubject = '試堂預約確認 - ' + CENTER_NAME;
  
  var emailBody = '親愛的家長您好：\n\n' +
    '感謝您為 ' + studentName + ' 同學預約試堂！\n\n' +
    '您的預約已確認，詳情如下：\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '  學生姓名：' + studentName + '\n' +
    '  年級：' + grade + '\n' +
    '  科目：' + subject + '\n' +
    '  預約日期：' + date + '\n' +
    '  預約時段：' + time + '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    '請於預約時間前10分鐘到達：\n' +
    '📍 地址：' + CENTER_ADDRESS + '\n' +
    '📞 電話：' + CENTER_PHONE + '\n\n' +
    '如需更改或取消預約，請提前24小時通知我們。\n\n' +
    '祝您生活愉快！\n\n' +
    CENTER_NAME;
  
  try {
    MailApp.sendEmail(email, emailSubject, emailBody);
    Logger.log('確認郵件已發送至：' + email);
  } catch (error) {
    Logger.log('發送郵件失敗：' + error.toString());
  }
}

// ========================================
// 發送拒絕郵件
// ========================================
function sendDeclineEmail(email, studentName, reason) {
  var emailSubject = '關於您的試堂預約 - ' + CENTER_NAME;
  
  var emailBody = '親愛的家長您好：\n\n' +
    '感謝您對' + CENTER_NAME + '的信任。\n\n' +
    '很抱歉，您為 ' + studentName + ' 同學預約的試堂未能安排：\n\n' +
    '原因：' + (reason || '時間安排問題') + '\n\n' +
    '請您重新預約其他時間，或致電我們安排：\n' +
    '📞 電話：' + CENTER_PHONE + '\n\n' +
    '感謝您的理解！\n\n' +
    CENTER_NAME;
  
  try {
    MailApp.sendEmail(email, emailSubject, emailBody);
    Logger.log('拒絕通知已發送至：' + email);
  } catch (error) {
    Logger.log('發送郵件失敗：' + error.toString());
  }
}

// ========================================
// 處理GET請求（用於測試）
// ========================================
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      'status': 'success',
      'message': '試堂預約系統API運行正常',
      'center': CENTER_NAME
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 測試函數
// ========================================
function testSaveBooking() {
  var testData = {
    id: 'BK' + Date.now().toString(36).toUpperCase(),
    timestamp: new Date().toLocaleString('zh-HK'),
    studentName: '測試學生',
    grade: '小一',
    subject: '數學',
    phone: '9123 4567',
    email: 'test@example.com',
    preferredDate: '下星期一',
    preferredTime: '下午3-5點',
    status: '待處理'
  };
  
  var mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  var result = doPost(mockEvent);
  Logger.log(result.getContent());
}

function testSendEmail() {
  // 注意：請將下面的郵箱地址改為您自己的郵箱進行測試
  sendConfirmationEmail(
    'your-email@example.com',
    '測試學生',
    '小一',
    '數學',
    '2024年1月15日（星期一）',
    '下午3:00 - 4:00'
  );
}
