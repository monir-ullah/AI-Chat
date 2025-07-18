import { useState } from "react";
import { Modal, FloatButton, Flex, type GetProp } from "antd";
import { CommentOutlined, UserOutlined } from "@ant-design/icons";
import { Bubble, Sender, useXAgent, useXChat } from "@ant-design/x";
import "./App.css";
import type { AnyObject } from "@ant-design/x/es/_util/type";
import type { XRequestParams } from "@ant-design/x/es/x-request";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini API Key
const GEMINI_API_KEY = "AIzaSyDUNQ_efhUlh-cWAWIuDW3odMFtA_eRv4c"; // Replace with your actual key

const roles: GetProp<typeof Bubble.List, "roles"> = {
  ai: {
    placement: "start",
    avatar: { icon: <UserOutlined />, style: { background: "#fde3cf" } },
    typing: { step: 5, interval: 20 },
    style: {
      maxWidth: 600,
    },
  },
  local: {
    placement: "end",
    avatar: { icon: <UserOutlined />, style: { background: "#87d068" } },
  },
};

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState("");

  const [agent] = useXAgent<string, { message: string }, string>({
    request: async ({ message }, { onSuccess, onError }) => {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        console.log({ model });
        const chatSession = await model.startChat({
          history: [],
          generationConfig: { maxOutputTokens: 1000 },
        });

        const result = await chatSession.sendMessage(message);
        const reply = result.response.text();

        onSuccess([reply]);
      } catch (error) {
        console.error("Gemini API Error:", error);
        onError(
          error instanceof Error ? error : new Error("Unknown Gemini error")
        );
      }
    },
  });

  const { onRequest, messages } = useXChat({
    agent,
    requestPlaceholder: "Waiting...",
    requestFallback: "Request failed. Please try again later.",
  });

  return (
    <div>
      <Modal
        title="SmartPOS: Chat with your AI Assistant"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        maskClosable={false}
        width={400}
        style={{
          position: "fixed",
          right: 24,
          margin: 0,
          paddingBottom: 0,
        }}
      >
        <Flex
          vertical
          gap="middle"
          style={{
            height: 720,
            overflowY: "auto",
            justifyContent: "flex-end",
          }}
        >
          <Bubble.List
            roles={roles}
            items={messages.map(({ id, message, status }) => ({
              key: id,
              loading: status === "loading",
              role: status === "local" ? "local" : "ai",
              content: message,
            }))}
          />
          <Sender
            loading={agent.isRequesting()}
            value={content}
            onChange={setContent}
            allowSpeech={true}
            onSubmit={(
              nextContent:
                | string
                | number
                | boolean
                | object
                | { message: string }
                | (Omit<XRequestParams, "message"> & {
                    message:
                      | "Waiting..."
                      | "Mock failed return. Please try again later.";
                  } & AnyObject)
            ) => {
              onRequest(nextContent);
              setContent("");
            }}
          />
        </Flex>
      </Modal>
      <FloatButton
        icon={<CommentOutlined />}
        type="primary"
        onClick={() => setIsModalOpen(true)}
        style={{
          right: 24,
          bottom: 24,
        }}
      />
    </div>
  );
}

export default App;
