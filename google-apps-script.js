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
    } else if (data.action === 'clientConfirm') {
      return clientConfirmBooking(data);
    } else if (data.action === 'updateBooking') {
      return updateBookingStatus(data);
    } else if (data.action === 'delete') {
      return deleteBooking(data);
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
      '就讀學校',
      '年級',
      '科目',
      '學習困難',
      '微信',
      'WhatsApp',
      '電話',
      '電郵地址',
      '來源',
      '希望日期',
      '希望時段',
      '確認日期',
      '確認時段',
      '狀態',
      '備註'
    ]);
    
    // 設置表頭樣式
    var headerRange = sheet.getRange('A1:S1');
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4a86e8');
    headerRange.setFontColor('#ffffff');
  }
  
  // 添加新的預約記錄
  sheet.appendRow([
    data.id || '',              // 預約ID
    data.timestamp || '',       // 提交時間
    data.studentName || '',     // 學生姓名
    data.school || '',          // 就讀學校
    data.grade || '',           // 年級
    data.subject || '',         // 科目
    data.studentDifficulty || '', // 學習困難
    data.contactWechat || '',   // 微信
    data.contactWhatsapp || '', // WhatsApp
    data.contactPhone || '',    // 電話
    data.email || '',           // 電郵地址
    data.source || '',          // 來源
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
  
  // 組合聯絡方式
  var contactInfo = [];
  if (data.contactWechat) contactInfo.push('微信: ' + data.contactWechat);
  if (data.contactWhatsapp) contactInfo.push('WhatsApp: ' + data.contactWhatsapp);
  if (data.contactPhone) contactInfo.push('電話: ' + data.contactPhone);
  var contactStr = contactInfo.length > 0 ? contactInfo.join('\n    ') : '未提供';
  
  var emailBody = typeText + '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    '📋 預約詳情：\n\n' +
    '  預約ID：' + (data.id || '無') + '\n' +
    '  提交時間：' + (data.timestamp || '無') + '\n' +
    '  學生姓名：' + (data.studentName || '無') + '\n' +
    '  年級：' + (data.grade || '無') + '\n' +
    '  科目：' + (data.subject || '無') + '\n' +
    (data.studentDifficulty ? '  📝 學習困難：' + data.studentDifficulty + '\n' : '') +
    '  聯絡方式：\n    ' + contactStr + '\n' +
    '  電郵地址：' + (data.email || '未提供') + '\n' +
    '  來源：' + (data.source || '未提供') + '\n' +
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
  
  // 列索引（新增學習困難欄位後的對應位置）
  // A:0預約ID, B:1提交時間, C:2學生姓名, D:3年級, E:4科目, F:5學習困難,
  // G:6微信, H:7WhatsApp, I:8電話, J:9電郵, K:10來源,
  // L:11希望日期, M:12希望時段, N:13確認日期, O:14確認時段, P:15狀態, Q:16備註
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === data.bookingId) {
      // 更新確認日期、確認時段和狀態
      sheet.getRange(i + 1, 14).setValue(data.confirmedDate);  // N列：確認日期
      sheet.getRange(i + 1, 15).setValue(data.confirmedTime);  // O列：確認時段
      sheet.getRange(i + 1, 16).setValue('待客戶確認');          // P列：狀態（等待家長確認）
      
      // 發送確認郵件
      if (values[i][9] && values[i][9] !== '未提供') {
        sendConfirmationEmail(
          values[i][9],  // 電郵（J列）
          values[i][2],  // 學生姓名
          values[i][3],  // 年級
          values[i][4],  // 科目
          data.confirmedDate,
          data.confirmedTime,
          data.bookingId  // 預約ID（用於生成管理連結）
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
  
  // 列索引（新增學習困難欄位後的對應位置）
  // J:9電郵, P:15狀態, Q:16備註
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === data.bookingId) {
      // 更新狀態和備註
      sheet.getRange(i + 1, 16).setValue('已拒絕');          // P列：狀態
      sheet.getRange(i + 1, 17).setValue(data.reason || ''); // Q列：備註
      
      // 發送拒絕郵件
      if (values[i][9] && values[i][9] !== '未提供') {
        sendDeclineEmail(
          values[i][9],  // 電郵（J列）
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
// 刪除預約記錄
// ========================================
function deleteBooking(data) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  // 查找並刪除對應的預約
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === data.bookingId) {
      // 刪除該行
      sheet.deleteRow(i + 1);
      Logger.log('已刪除預約：' + data.bookingId);
      break;
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      'status': 'success',
      'message': '預約已刪除'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 更新預約狀態（客戶取消/更改）
// ========================================
function updateBookingStatus(data) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  var studentName = data.studentName || '';
  var originalId = data.originalId || '';
  
  // 列索引（新增學習困難欄位後的對應位置）
  // A:0預約ID, B:1提交時間, C:2學生姓名, D:3年級, E:4科目, F:5學習困難,
  // G:6微信, H:7WhatsApp, I:8電話, J:9電郵, K:10來源,
  // L:11希望日期, M:12希望時段, N:13確認日期, O:14確認時段, P:15狀態, Q:16備註
  
  // 查找原預約
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === originalId) {
      if (data.type === 'cancel') {
        // 更新狀態為「已取消」
        sheet.getRange(i + 1, 16).setValue('已取消');  // P列：狀態
        sheet.getRange(i + 1, 17).setValue('客戶取消 - ' + (data.reason || '無原因') + ' (' + data.timestamp + ')');
        
        // 發送通知給管理員
        sendAdminCancelNotification(studentName, values[i][13], values[i][14], data.reason);
        
      } else if (data.type === 'change') {
        // 更新狀態為「更改中」
        sheet.getRange(i + 1, 16).setValue('更改中');  // P列：狀態
        sheet.getRange(i + 1, 17).setValue('客戶申請更改 - 新時段：' + data.newPreferredDate + ' (' + data.timestamp + ')');
        
        // 添加新的預約記錄
        sheet.appendRow([
          'CH' + Date.now().toString(36).toUpperCase(),  // 新ID
          data.timestamp,                                 // 提交時間
          studentName,                                    // 學生姓名
          values[i][3],                                   // 年級
          values[i][4],                                   // 科目
          values[i][5],                                   // 學習困難
          values[i][6],                                   // 微信
          values[i][7],                                   // WhatsApp
          values[i][8],                                   // 電話
          values[i][9],                                   // 電郵
          values[i][10],                                  // 來源
          data.newPreferredDate,                          // 新希望日期
          '',                                             // 希望時段
          '',                                             // 確認日期
          '',                                             // 確認時段
          '待處理',                                       // 狀態
          '更改自：' + originalId                         // 備註
        ]);
        
        // 發送通知給管理員
        sendAdminChangeNotification(studentName, values[i][13], values[i][14], data.newPreferredDate);
      }
      break;
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      'status': 'success',
      'message': '預約狀態已更新'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 發送取消通知給管理員
// ========================================
function sendAdminCancelNotification(studentName, originalDate, originalTime, reason) {
  var emailSubject = '❌ 客戶取消預約 - ' + studentName;
  
  var emailBody = '📢 預約取消通知\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    '以下預約已被家長取消：\n\n' +
    '  學生姓名：' + studentName + '\n' +
    '  原預約日期：' + originalDate + '\n' +
    '  原預約時段：' + originalTime + '\n' +
    '  取消原因：' + (reason || '未提供') + '\n\n' +
    '取消時間：' + new Date().toLocaleString('zh-HK') + '\n\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    CENTER_NAME + ' 預約系統';
  
  try {
    MailApp.sendEmail(ADMIN_EMAIL, emailSubject, emailBody);
  } catch (error) {
    Logger.log('發送通知失敗：' + error.toString());
  }
}

// ========================================
// 發送更改通知給管理員
// ========================================
function sendAdminChangeNotification(studentName, originalDate, originalTime, newPreferredDate) {
  var emailSubject = '🔄 客戶申請更改預約 - ' + studentName;
  
  var emailBody = '📢 預約更改申請\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    '以下預約家長申請更改：\n\n' +
    '  學生姓名：' + studentName + '\n' +
    '  原預約日期：' + originalDate + '\n' +
    '  原預約時段：' + originalTime + '\n\n' +
    '  📅 新希望時段：\n  ' + newPreferredDate.replace(/; /g, '\n  ') + '\n\n' +
    '申請時間：' + new Date().toLocaleString('zh-HK') + '\n\n' +
    '請登入管理後台處理此申請：\n' +
    'https://trial-booking-system.pages.dev/admin.html\n\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    CENTER_NAME + ' 預約系統';
  
  try {
    MailApp.sendEmail(ADMIN_EMAIL, emailSubject, emailBody);
  } catch (error) {
    Logger.log('發送通知失敗：' + error.toString());
  }
}

// ========================================
// 客戶確認預約（家長點擊確認連結）
// ========================================
function clientConfirmBooking(data) {
  // 獲取試算表
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  
  // 查找對應的預約（根據ID）
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  // 列索引（新增學習困難欄位後的對應位置）
  // C:2學生姓名, N:13確認日期, O:14確認時段, P:15狀態, Q:16備註
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === data.bookingId) {
      // 更新狀態為「已確認」
      sheet.getRange(i + 1, 16).setValue('已確認');  // P列：狀態
      sheet.getRange(i + 1, 17).setValue('客戶已確認 - ' + new Date().toLocaleString('zh-HK')); // Q列：備註
      
      // 發送通知給管理員
      sendAdminClientConfirmNotification(values[i][2], values[i][13], values[i][14]);
      
      break;
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      'status': 'success',
      'message': '客戶已確認預約'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 發送客戶確認通知給管理員
// ========================================
function sendAdminClientConfirmNotification(studentName, confirmedDate, confirmedTime) {
  var emailSubject = '✅ 客戶已確認預約 - ' + studentName;
  
  var emailBody = '📢 客戶確認通知\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    '以下預約已被家長確認：\n\n' +
    '  學生姓名：' + studentName + '\n' +
    '  確認日期：' + confirmedDate + '\n' +
    '  確認時段：' + confirmedTime + '\n\n' +
    '確認時間：' + new Date().toLocaleString('zh-HK') + '\n\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    CENTER_NAME + ' 預約系統';
  
  try {
    MailApp.sendEmail(ADMIN_EMAIL, emailSubject, emailBody);
    Logger.log('客戶確認通知已發送至管理員');
  } catch (error) {
    Logger.log('發送管理員通知失敗：' + error.toString());
  }
}

// ========================================
// 發送確認郵件（帶確認連結）
// ========================================
function sendConfirmationEmail(email, studentName, grade, subject, date, time, bookingId) {
  var emailSubject = '📅 請確認您的試堂預約 - ' + CENTER_NAME;
  
  // 生成確認預約的連結
  var confirmUrl = 'https://trial-booking-system.pages.dev/confirm-booking.html?' +
    'id=' + encodeURIComponent(bookingId || '') +
    '&name=' + encodeURIComponent(studentName) +
    '&date=' + encodeURIComponent(date) +
    '&time=' + encodeURIComponent(time) +
    '&subject=' + encodeURIComponent(subject);
  
  // 生成管理預約的連結（更改/取消）
  var manageUrl = 'https://trial-booking-system.pages.dev/manage.html?' +
    'id=' + encodeURIComponent(bookingId || '') +
    '&name=' + encodeURIComponent(studentName) +
    '&date=' + encodeURIComponent(date) +
    '&time=' + encodeURIComponent(time) +
    '&subject=' + encodeURIComponent(subject);
  
  var emailBody = '親愛的家長您好：\n\n' +
    '感謝您為 ' + studentName + ' 同學預約試堂！\n\n' +
    '我們已為您安排以下時間：\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '  學生姓名：' + studentName + '\n' +
    '  年級：' + grade + '\n' +
    '  科目：' + subject + '\n' +
    '  預約日期：' + date + '\n' +
    '  預約時段：' + time + '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    '⚠️ 【重要：請點擊以下連結確認預約】⚠️\n\n' +
    '👉 ' + confirmUrl + '\n\n' +
    '📌 請注意：\n' +
    '• 您必須點擊上方連結確認，預約才會生效\n' +
    '• 如未在預約日期前確認，預約將自動過期\n' +
    '• 確認後我們會為您保留時段\n\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '📍 上課地點：' + CENTER_ADDRESS + '\n' +
    '📞 聯絡電話：' + CENTER_PHONE + '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    '📝 如需更改或取消預約，請點擊：\n' +
    manageUrl + '\n\n' +
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
// 處理GET請求（獲取所有預約記錄）
// ========================================
function doGet(e) {
  try {
    var action = e.parameter.action || 'status';
    
    if (action === 'getAll') {
      return getAllBookings();
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({
          'status': 'success',
          'message': '試堂預約系統API運行正常',
          'center': CENTER_NAME
        }))
        .setMimeType(ContentService.MimeType.JSON);
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
// 獲取所有預約記錄
// ========================================
function getAllBookings() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  // 如果沒有數據或只有表頭
  if (values.length <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify({
        'status': 'success',
        'data': []
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // 轉換為對象數組
  // 列索引（新增學習困難欄位後的對應位置）
  // A:0預約ID, B:1提交時間, C:2學生姓名, D:3年級, E:4科目, F:5學習困難,
  // G:6微信, H:7WhatsApp, I:8電話, J:9電郵, K:10來源,
  // L:11希望日期, M:12希望時段, N:13確認日期, O:14確認時段, P:15狀態, Q:16備註
  var bookings = [];
  
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var booking = {
      id: row[0] || '',
      timestamp: row[1] || '',
      studentName: row[2] || '',
      grade: row[3] || '',
      subject: row[4] || '',
      studentDifficulty: row[5] || '',
      contactWechat: row[6] || '',
      contactWhatsapp: row[7] || '',
      contactPhone: row[8] || '',
      email: row[9] || '',
      source: row[10] || '',
      preferredDate: row[11] || '',
      preferredTime: row[12] || '',
      confirmedDate: row[13] || '',
      confirmedTime: row[14] || '',
      status: row[15] || '待處理',
      notes: row[16] || '',
      type: 'booking' // 默認類型
    };
    
    // 組合聯絡電話（向後兼容）
    var contactInfo = [];
    if (booking.contactWechat) contactInfo.push('微信: ' + booking.contactWechat);
    if (booking.contactWhatsapp) contactInfo.push('WhatsApp: ' + booking.contactWhatsapp);
    if (booking.contactPhone) contactInfo.push('電話: ' + booking.contactPhone);
    booking.phone = contactInfo.join(' | ');
    
    // 根據 ID 前綴判斷類型
    if (booking.id.startsWith('CL')) {
      booking.type = 'cancel';
    } else if (booking.id.startsWith('CH')) {
      booking.type = 'change';
    }
    
    bookings.push(booking);
  }
  
  // 按時間倒序排列（最新的在前）
  bookings.reverse();
  
  return ContentService
    .createTextOutput(JSON.stringify({
      'status': 'success',
      'data': bookings
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
