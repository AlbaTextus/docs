# 构建与发布

## 本地构建与运行

将前端构建放在仓库的 `release/` 下；构建和启动必须使用同一个 `NEXT_OUTPUT_DIR`。

Bash：

```bash
NEXT_OUTPUT_DIR=../release/web pnpm web:build
NEXT_OUTPUT_DIR=../release/web pnpm web:start
```

PowerShell：

```powershell
$env:NEXT_OUTPUT_DIR = '../release/web'
pnpm web:build
pnpm web:start
```

Go 服务可用 `go build -o ../release/atnexus ./cmd/server` 构建，Windows 可将输出命名为 `../release/atnexus.exe`。运行时在仓库目录提供 `.env` 或进程环境变量。

## Linux AMD64 发布包

支持 Windows 原生构建，无需 WSL 或 Docker。构建机安装 Go（版本见 `go.mod`）、
Node.js 20.9 或更新版本、Corepack 和 `tar`（Windows 自带），在项目根目录执行：

```bash
node scripts/build-linux-amd64.mjs
# 可指定发布包名称；同名产物已存在时会退出，避免覆盖。
node scripts/build-linux-amd64.mjs atnexus-linux-amd64-v1
# 也可通过项目命令执行。
pnpm build:linux-amd64
```

Windows 也可使用 PowerShell 入口：

```powershell
.\scripts\build-linux-amd64.ps1
.\scripts\build-linux-amd64.ps1 -Name atnexus-linux-amd64-v1
```

Linux 可运行 `bash scripts/build-linux-amd64.sh`。Corepack 未安装时先运行
`npm install --global corepack`。构建时，`OAUTH_BACKEND_URL` 和 `CREATPLAT_BACKEND_URL`
默认都指向聚合入口 `http://127.0.0.1:8010`；浏览器使用的 `NEXT_PUBLIC_ATHUB_API_URL`
和 `NEXT_PUBLIC_CREATPLAT_API_URL` 默认都是 `http://localhost:8010`。
本地 `.env` 文件不参与构建，公开地址和 Next.js 转发目标修改后需要重新构建。

脚本复制当前工作目录源码（包括未提交的修改）到 `temp/`，安装锁定依赖并构建，
退出时清理临时目录。开发依赖与前端构建目录不受影响。产物位于项目的 `release/`：

- `<名称>/`：静态 Go 后端、Next.js 前端、Linux AMD64 生产依赖、启动脚本、
  四套数据库的 Prisma schema 与 `.env.example`。
- `<名称>.tar.gz` 和 `<名称>.tar.gz.sha256`：完整发布包与校验文件。

目标服务器需要 Linux AMD64、glibc 和 Node.js 20.9 或更新版本（推荐 Node.js 24），
不适用于 Alpine/musl。构建包不附带 Node.js。前端先在构建机编译，再独立安装 Linux 的
生产依赖，不打包 Windows 开发依赖。部署时在发布目录提供 `.env`，
执行 `chmod +x atnexus start-backend.sh start-frontend.sh`，
分别运行 `./start-backend.sh`、`./start-frontend.sh`；
前端默认监听 `3288`，可通过 `HOSTNAME_OVERRIDE` 和 `PORT` 调整。
脚本不会自动建表或执行 seed，建表见[数据库](/deploy/database)。

### 发布包内容

| 路径 | 内容 |
| --- | --- |
| `atnexus` | 静态编译的 Go 后端 |
| `start-backend.sh`、`start-frontend.sh` | 后端与前端的启动脚本 |
| `frontend/` | 已构建的 Next.js 前端及 Linux AMD64 生产依赖 |
| `database/account`、`database/content`、`database/creator`、`database/image` | 四套数据库的 Prisma schema |
| `.env.example`、`README.txt`、`SHA256SUMS` | 配置样例、发布说明和逐文件校验清单 |

解压后可用 `sha256sum -c SHA256SUMS` 校验文件。启动后端前在其 `.env` 中设置 `GATEWAY_HTTP_ADDR=:8010`；前端默认监听 `3288`，其启动脚本不读取后端的 `.env`。

`OAUTH_BACKEND_URL` 也用于前端运行时的服务端账户请求，可以在启动前覆盖；Next.js 的转发目标与 `NEXT_PUBLIC_*` 地址仍需在构建前设置，改动后重新构建。
