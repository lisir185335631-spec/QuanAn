// QuanAn · vitest global test setup
// Integration test env vars and global mocks go here in later PRDs
import * as dotenv from 'dotenv';
dotenv.config();

// 测试库 env 变量名兼容:测试代码统一读 DATABASE_URL_TEST,
// 历史 .env 写的是 TEST_DATABASE_URL —— 缺前者时映射,防止 fallback 到不存在的
// quanan_test(或更糟:admin 集成测试 fallback 到 dev 库 DATABASE_URL)。
process.env.DATABASE_URL_TEST ??= process.env.TEST_DATABASE_URL;

// 测试进程一律打到测试库:admin 集成测试经 app prisma 单例(读 DATABASE_URL)走
// tRPC router,fixtures 经 DATABASE_URL_TEST 写种子 —— 两边必须同库;
// 同时保证 npm test 永不读写 dev 库(此前 fallback 会truncate dev 数据,危险)。
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
  process.env.DIRECT_URL = process.env.DATABASE_URL_TEST;
}
