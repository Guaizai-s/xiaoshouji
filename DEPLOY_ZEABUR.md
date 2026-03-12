# Zeabur 部署配置

此项目可以部署到 Zeabur，无需VPN即可访问。

## 部署步骤

### 方式一：通过 GitHub 部署（推荐）

1. **上传代码到 GitHub**
   - 在 GitHub 创建新仓库
   - 将本地代码推送到仓库

2. **连接 Zeabur**
   - 访问 https://zeabur.com
   - 使用 GitHub 登录
   - 点击「Create Project」
   - 选择「Import from GitHub」
   - 选择你的仓库
   - Zeabur 会自动检测并部署

3. **自动部署**
   - Zeabur 会自动运行 `npm install` 和 `npm run build`
   - 部署完成后会给你一个域名
   - 可以绑定自定义域名

### 方式二：通过 Zeabur CLI 部署

```bash
# 安装 Zeabur CLI
npm install -g @zeabur/cli

# 登录
zeabur auth login

# 部署
zeabur deploy
```

## 环境变量

无需配置环境变量，所有配置都在客户端完成。

## 注意事项

- API Key 存储在用户浏览器本地，不会上传到服务器
- 部署后是纯静态网站，非常安全
- 支持 PWA，可以安装到手机桌面

## 域名

部署成功后，Zeabur 会提供：
- 默认域名：`xxx.zeabur.app`
- 支持绑定自定义域名
- 自动 HTTPS 证书

访问域名后即可使用，无需任何额外配置！
