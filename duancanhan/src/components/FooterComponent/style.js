import styled from 'styled-components';

export const FooterWrapper = styled.footer`
  background-color: #fff;
  padding: 40px 0 20px;
  border-top: 1px solid #ebebf0;
  margin-top: 40px;
`;

export const FooterContainer = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
`;

export const FooterSection = styled.div`
  margin-bottom: 24px;
`;

export const SocialIcon = styled.a`
  font-size: 24px;
  color: #808089;
  margin-right: 16px;
  transition: color 0.3s;
  &:hover {
    color: var(--primary-color);
  }
`;

export const FooterBottom = styled.div`
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
  text-align: center;
  margin-top: 20px;
`;
