import styled from 'styled-components';

export const InvoiceWrapper = styled.div`
    padding: 40px;
    background: white;
    width: 800px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
`;

export const Header = styled.div`
    display: flex;
    justify-content: space-between;
    border-bottom: 2px solid #1890ff;
    padding-bottom: 20px;
    margin-bottom: 30px;
`;

export const CompanyInfo = styled.div`
    flex: 1;
`;

export const InvoiceTitle = styled.div`
    text-align: right;
    flex: 1;
`;

export const Section = styled.div`
    margin-bottom: 20px;
`;

export const SectionTitle = styled.div`
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 10px;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 5px;
    color: #1890ff;
`;

export const InfoRow = styled.div`
    display: flex;
    margin-bottom: 5px;
`;

export const Label = styled.div`
    width: 150px;
    font-weight: 500;
`;

export const Value = styled.div`
    flex: 1;
`;

export const TotalSection = styled.div`
    margin-top: 30px;
    text-align: right;
    border-top: 2px solid #f0f0f0;
    padding-top: 10px;
`;
