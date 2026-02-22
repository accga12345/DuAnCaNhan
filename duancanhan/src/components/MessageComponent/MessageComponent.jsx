import { message } from "antd";

let messageApi;

export const MessageComponent = ({ children }) => {
  const [api, contextHolder] = message.useMessage();
  messageApi = api;

  return (
    <>
      {contextHolder}
      {children}
    </>
  );
};

export const showSuccess = (content) => {
  messageApi?.success(content);
};

export const showError = (content) => {
  messageApi?.error(content);
};
