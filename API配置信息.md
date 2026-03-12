# Claude API 配置信息

## API 基本信息

- **服务商**: GPTGod
- **端点地址**: `https://api.gptgod.online/v1/messages`
- **API Key**: `sk-xxkn20010z5l0kj1521wy4x5jznlwl5yxxkn20010z5l0kj1`
- **接口格式**: Anthropic Messages API（官方格式）
- **可用模型**: `claude-sonnet-4-6`

## 认证方式

```
x-api-key: sk-xxkn20010z5l0kj1521wy4x5jznlwl5yxxkn20010z5l0kj1
anthropic-version: 2023-06-01
content-type: application/json
```

## 请求示例

```bash
curl -X POST "https://api.gptgod.online/v1/messages" \
  -H "x-api-key: sk-xxkn20010z5l0kj1521wy4x5jznlwl5yxxkn20010z5l0kj1" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "你好"}
    ]
  }'
```

## Python 客户端代码模板

```python
import requests

class ClaudeClient:
    def __init__(self):
        self.api_key = "sk-xxkn20010z5l0kj1521wy4x5jznlwl5yxxkn20010z5l0kj1"
        self.base_url = "https://api.gptgod.online"
        self.model = "claude-sonnet-4-6"

    def chat(self, messages, max_tokens=1024):
        url = f"{self.base_url}/v1/messages"

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

        data = {
            "model": self.model,
            "max_tokens": max_tokens,
            "messages": messages
        }

        response = requests.post(url, headers=headers, json=data)
        return response.json()

# 使用示例
client = ClaudeClient()
result = client.chat([
    {"role": "user", "content": "你好"}
])
print(result["content"][0]["text"])
```

## 测试状态

- ✅ 已测试通过（2026-03-11）
- ✅ API Key 有效
- ✅ 模型可用
- ✅ 返回正常

## 注意事项

1. 这是 Anthropic 官方格式，不是 OpenAI 格式
2. 必需参数：`max_tokens`
3. 认证头使用 `x-api-key`，不是 `Authorization: Bearer`
