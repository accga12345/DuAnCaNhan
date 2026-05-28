const axios = require('axios');
const fs = require('fs');
const dataset = require('./golden_dataset.json');

const runEvaluation = async () => {
    let total = dataset.length;
    let passed = 0;
    const report = [];

    console.log("--- BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG ---");

    for (const test of dataset) {
        console.log(`Đang kiểm thử: "${test.input}"`);
        try {
            // Gửi request tới API chat
            const res = await axios.post('http://localhost:3001/api/chat/message', { 
                message: test.input, 
                history: [] 
            });
            
            // Logic đánh giá: Kiểm tra Intent có khớp không
            const isPass = res.data.intent === test.expectedIntent;
            if (isPass) passed++;

            report.push({
                input: test.input,
                expected_intent: test.expectedIntent,
                actual_intent: res.data.intent,
                actual_response: res.data.message,
                result: isPass ? "PASS" : "FAIL"
            });
        } catch (e) {
            report.push({ input: test.input, error: e.message, result: "ERROR" });
        }
    }

    const accuracy = ((passed / total) * 100).toFixed(2);
    const finalReport = { total, passed, accuracy: accuracy + "%", report };
    
    fs.writeFileSync('final_report.json', JSON.stringify(finalReport, null, 2));
    
    console.log("--- KIỂM THỬ HOÀN TẤT ---");
    console.log(`Tỉ lệ chính xác: ${accuracy}%`);
    console.log("Kết quả chi tiết đã được lưu tại: final_report.json");
};

runEvaluation();