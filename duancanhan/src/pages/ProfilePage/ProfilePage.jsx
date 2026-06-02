import React, { useEffect, useState } from "react";
import { Form, Input, Button, Image, Upload } from "antd";
import { useSelector } from "react-redux";
import { updateUserInfo } from "../../services/UserServices";
import { useMutationHook } from "../../hooks/useMutationHook";
import { useDispatch } from "react-redux";
import { updateUser } from "../../redux/slides/userSlide";
import { getDetailUser } from "../../services/UserServices";
import { showSuccess, showError } from "../../components/MessageComponent/MessageComponent";
import LoadingComponent from "../../components/Loading/LoadingComponent";
import { PlusOutlined } from '@ant-design/icons';
import { getBase64 } from '../../ultil';

function ProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [form] = Form.useForm();

  const [editing, setEditing] = useState({
    name: false,
    email: false,
    phone: false,
    address: false,
    avatar: false,
  });

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
      });
    }
  }, [user]);

  const mutation = useMutationHook((data) =>
    updateUserInfo(user._id, data, user.accessToken)
  );

  const { data, isPending, isSuccess, isError } = mutation;

  useEffect(() => {
    if (isSuccess) {
      showSuccess(data.message);
      handleGetDetailUser(user._id, user.accessToken);
    } else if (isError) {
      showError(mutation.error.response.data.message || "Cập nhật thông tin thất bại");
    }

  }, [isSuccess, isError]);


  const updateField = (field) => {
    const value = form.getFieldValue(field);
    mutation.mutate({ [field]: value });
    setEditing((prev) => ({
      ...prev,
      [field]: false,
    }));
  };

  const handleGetDetailUser = async (id, accessToken) => {
    const res = await getDetailUser(id, accessToken);
    dispatch(updateUser({ ...res.data, accessToken: accessToken }));
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (user?.avatar) {
      setFileList([
        {
          uid: "-1",
          name: "avatar.png",
          status: "done",
          url: user.avatar,
        },
      ]);
    }
  }, [user]);



  const handlePreview = async file => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const handleChangeAvatar = async ({ file, fileList: newFileList }) => {
    const realFile = file.originFileObj || file;

    if (!(realFile instanceof Blob)) return;

    const base64 = await getBase64(realFile);
    form.setFieldsValue({ avatar: base64 });
    setFileList(newFileList.slice(-1));
  };


  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  return (
    <div style={{ maxWidth: 500, margin: "40px auto" }}>
      <h2>Thông tin tài khoản</h2>
      <LoadingComponent isPending={isPending}>
        <Form form={form} layout="vertical">

          {/* NAME */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
            <Form.Item label="Tên người dùng" name="name" style={{ flex: 1, marginBottom: 0 }}>
              <Input disabled={!editing.name} />
            </Form.Item>
            <Button onClick={() =>
              editing.name
                ? updateField("name")
                : setEditing({ ...editing, name: true })
            }>
              {editing.name ? "Lưu" : "Cập nhật"}
            </Button>
          </div>

          {/* EMAIL */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
            <Form.Item label="Email" name="email" style={{ flex: 1, marginBottom: 0 }}>
              <Input disabled={!editing.email} />
            </Form.Item>
            <Button onClick={() =>
              editing.email
                ? updateField("email")
                : setEditing({ ...editing, email: true })
            }>
              {editing.email ? "Lưu" : "Cập nhật"}
            </Button>
          </div>

          {/* PHONE */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
            <Form.Item 
              label="Số điện thoại" 
              name="phone" 
              style={{ flex: 1, marginBottom: 0 }}
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại' },
                { len: 10, message: 'Số điện thoại phải có đúng 10 chữ số' },
                { pattern: /^[0-9]+$/, message: 'Số điện thoại chỉ được chứa chữ số' }
              ]}
            >
              <Input disabled={!editing.phone} />
            </Form.Item>
            <Button onClick={() =>
              editing.phone
                ? updateField("phone")
                : setEditing((prev) => ({ ...prev, phone: true }))
            }>
              {editing.phone ? "Lưu" : "Cập nhật"}
            </Button>
          </div>

          {/* AVATAR */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
            <Form.Item label="Hình ảnh" name="avatar" style={{ flex: 1, marginBottom: 0 }}>
              <Upload
                disabled={!editing.avatar}
                listType="picture-circle"
                onPreview={handlePreview}
                onChange={handleChangeAvatar}
                beforeUpload={() => false}
                onRemove={() => {
                  setFileList([]);
                }}
                fileList={fileList}
              >
                {uploadButton}
              </Upload>
              {previewImage && (
                <Image
                  styles={{ root: { display: 'none' } }}
                  preview={{
                    visible: previewOpen,
                    onVisibleChange: visible => setPreviewOpen(visible),
                    afterOpenChange: visible => !visible && setPreviewImage(''),
                  }}
                  src={previewImage}
                />
              )}
              <Button style={{ marginTop: "8px" }} onClick={() =>
                editing.avatar
                  ? updateField("avatar")
                  : setEditing({ ...editing, avatar: true })
              }>
                {editing.avatar ? "Lưu" : "Cập nhật"}
              </Button>
            </Form.Item>
          </div>

          {/* ADDRESS */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
            <Form.Item label="Địa chỉ" name="address" style={{ flex: 1, marginBottom: 0 }}>
              <Input disabled={!editing.address} />
            </Form.Item>
            <Button onClick={() =>
              editing.address
                ? updateField("address")
                : setEditing({ ...editing, address: true })
            }>
              {editing.address ? "Lưu" : "Cập nhật"}
            </Button>
          </div>
        </Form>
      </LoadingComponent>
    </div>
  );
}

export default ProfilePage;
