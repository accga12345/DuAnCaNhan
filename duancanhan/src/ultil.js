import * as XLSX from 'xlsx';

export const isJsonString = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

export const getBase64 = async file => {
    if (typeof file === 'string' && file.startsWith('http')) return file;
    
    try {
        const formData = new FormData();
        formData.append('image', file);
        const baseUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(`${baseUrl}/upload`, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        if (data.status === 'success') {
            return data.url;
        }
    } catch (e) {
        console.error("Image upload failed, falling back to base64", e);
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

export const getLevelKeys = items1 => {
    const key = {};
    const func = (items2, level = 1) => {
        items2.forEach(item => {
            if (item.key) {
                key[item.key] = level;
            }
            if (item.children) {
                func(item.children, level + 1);
            }
        });
    };
    func(items1);
    return key;
};

export const exportExcel = (data, fileName, sheetName, title = "", dateRange = "") => {
    const wb = XLSX.utils.book_new();
    const exportDate = new Date().toLocaleString('vi-VN');
    
    // Tạo mảng dữ liệu với tiêu đề, ngày tháng và ngày xuất
    const excelData = [];
    
    if (title) {
        excelData.push([title]);
    }
    
    excelData.push([`Ngày xuất file: ${exportDate}`]);

    if (dateRange) {
        excelData.push([`Khoảng thời gian báo cáo: ${dateRange}`]);
    }
    
    excelData.push([]); // Dòng trống trước khi vào bảng
    
    // Thêm header của bảng
    if (data.length > 0) {
        excelData.push(Object.keys(data[0]));
        
        // Thêm dữ liệu bảng
        data.forEach(item => {
            excelData.push(Object.values(item));
        });
        
        // Tính dòng tổng cộng nếu là dữ liệu số
        const summaryRow = {};
        const firstRow = data[0];
        let hasNumber = false;
        
        Object.keys(firstRow).forEach((key, index) => {
            if (index === 0) {
                summaryRow[key] = "TỔNG CỘNG";
            } else if (typeof firstRow[key] === 'number') {
                summaryRow[key] = data.reduce((sum, item) => sum + (item[key] || 0), 0);
                hasNumber = true;
            } else {
                summaryRow[key] = "";
            }
        });
        
        if (hasNumber) {
            excelData.push([]);
            excelData.push(Object.values(summaryRow));
        }
    }
    
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Căn chỉnh độ rộng cột cơ bản
    const wscols = [];
    if (excelData.length > 0) {
        const maxCols = Math.max(...excelData.map(row => row.length));
        for (let i = 0; i < maxCols; i++) {
            wscols.push({ wch: 20 });
        }
    }
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export const convertToSlug = (text) => {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/\s/g, "_")
}

export const convertPrice = (price) => {
    try {
        const result = price?.toLocaleString().replaceAll(',', '.')
        return `${result}đ`
    } catch (error) {
        return null
    }
}

