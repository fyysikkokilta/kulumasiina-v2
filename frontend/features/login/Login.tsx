import { Button, Space } from "antd";

import { Content } from "antd/es/layout/layout";

import "./Login.css";
import { apiURL } from "../utils";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
export const Login = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Content className="login">
      <Space>
        <Button type="primary" href={`${apiURL}/login/google`}>
          {" "}
          {t("login.login_google")}{" "}
        </Button>
        <Button onClick={() => navigate("/")}> {t("login.cancel")} </Button>
      </Space>
    </Content>
  );
};
