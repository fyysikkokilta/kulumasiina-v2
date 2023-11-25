import { Button, Space } from "antd";

import { Content } from "antd/es/layout/layout";

import "./Login.css";
import { apiURL } from "../utils";
import { useNavigate } from "react-router-dom";
export const Login = () => {
  const navigate = useNavigate();

  return (
    <Content className="login">
      <Space>
        <Button type="primary" href={`${apiURL}/login/google`}>
          {" "}
          Sign in with Google{" "}
        </Button>
        <Button onClick={() => navigate("/")}> Cancel </Button>
      </Space>
    </Content>
  );
};
