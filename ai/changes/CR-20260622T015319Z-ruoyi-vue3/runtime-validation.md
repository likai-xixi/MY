# Runtime Validation

Validated at: 2026-06-22 12:12:24 +08:00

## Dependency Check

- Docker dependency containers were already available locally:
  - MySQL: `mj-mysql`, image `mysql:8.0`, port `3306`.
  - Redis: `mj-redis`, image `redis:7`, port `6379`.
- Redis validation: `docker exec mj-redis redis-cli -n 1 ping` returned `PONG`.
- SQL source files were present:
  - `sql/ry_20260417.sql`
  - `sql/quartz.sql`
- Runtime database was isolated as `my_ry_vue_runtime` to avoid touching the existing `ry-vue` database used by other local RuoYi work.
- SQL import result:
  - `my_ry_vue_runtime` contains 31 tables.
  - Default users `admin` and `ry` exist with status `0`.
  - Menus include `系统管理`, `系统监控`, `系统工具`, `服务监控`, and `代码生成`.

## Local Startup Plan

Existing local services already occupied default RuoYi ports:

- `8080`: existing Java RuoYi backend from `D:\Project\MjProcess`.
- `80`: existing Vite frontend from `D:\Project\MjProcess`.

To keep this project isolated and avoid stopping unrelated local work, this validation used:

- Backend: `http://localhost:18080`
- Frontend: `http://127.0.0.1:5173`
- Database: `my_ry_vue_runtime`
- Redis logical DB: `1`
- Frontend proxy override: `RUOYI_API_BASE=http://localhost:18080`

The frontend proxy target was made configurable in `ruoyi-ui/vite.config.js` through `process.env.RUOYI_API_BASE`, while preserving the original default `http://localhost:8080`.

## Startup Evidence

- Backend was packaged with Maven from the locked runtime policy path:
  - `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd clean package -DskipTests`
- Backend process:
  - PID: `52184`
  - Command: `java -jar ruoyi-admin\target\ruoyi-admin.jar --server.port=18080 ... --spring.data.redis.database=1`
  - PID file: `ai/changes/CR-20260622T015319Z-ruoyi-vue3/runtime-evidence/backend.pid`
- Frontend process:
  - Wrapper PID: `35824`
  - Vite child PID: `32112`
  - Command: `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`
  - PID file: `ai/changes/CR-20260622T015319Z-ruoyi-vue3/runtime-evidence/frontend.pid`

## HTTP Checks

- `http://localhost:18080/captchaImage` returned `200`.
- `http://127.0.0.1:5173/` returned `200`.
- `http://127.0.0.1:5173/dev-api/captchaImage` returned `200`.

## Browser Checks

Browser URL: `http://127.0.0.1:5173`

- Login page:
  - Title: `若依管理系统`
  - Visible controls: `账号`, `密码`, `验证码`, `记住密码`, `登 录`
  - Captcha image rendered as `.login-code-img`.
- Login:
  - User: `admin`
  - Password: default RuoYi development password
  - Captcha validated against the isolated local Redis DB1 value for the refreshed captcha key.
  - Redirected to `http://127.0.0.1:5173/index`.
- Home:
  - Home page rendered `若依后台管理框架`.
  - Version text rendered `v3.9.2`.
- System management:
  - Menu expanded.
  - `用户管理` page opened at `/system/user`.
  - Page showed `用户管理`, `用户名称`, `手机号码`, `新增`, `删除`, and `导出`.
- Monitor:
  - Menu expanded.
  - `服务监控` page opened at `/monitor/server`.
  - Page showed `服务监控`, `CPU`, `内存`, `服务器信息`, `Java虚拟机信息`, and `磁盘状态`.
- Code generation:
  - `代码生成` page opened at `/tool/gen`.
  - Page showed `代码生成`, `表名称`, `表描述`, `生成`, and `导入`.

Screenshot evidence:

- `ai/changes/CR-20260622T015319Z-ruoyi-vue3/runtime-evidence/browser-tool-gen.png`

## Remaining Runtime Risk

- Validation used local development defaults and an isolated development database; it is not production deployment evidence.
- `ruoyi-ui` dependency install reported `8 vulnerabilities (3 moderate, 5 high)` from `npm audit`; no forced dependency rewrite was applied during runtime validation.
- Only representative built-in RuoYi pages were browser-verified. CRUD mutations, import/export, Druid page authentication, Swagger page behavior, scheduled jobs, and production build deployment remain unverified.
- Backend and frontend processes were left running for user inspection unless stopped later.
