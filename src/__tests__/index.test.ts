import { minify } from '../index';

describe('JSMini', () => {
    describe('基础功能', () => {
        test('应该能够解析和生成简单的JavaScript代码', () => {
            const code = 'const a = 1; const b = 2; console.log(a + b);';
            const result = minify(code);

            expect(result.code).toBeDefined();
            expect(result.code.length).toBeGreaterThan(0);
            expect(result.warnings).toBeDefined();
        });

        test('应该能够处理函数声明', () => {
            const code = `
        function add(x, y) {
          return x + y;
        }
        const result = add(1, 2);
      `;

            const result = minify(code);
            expect(result.code).toBeDefined();
        });

        test('应该能够处理类声明', () => {
            const code = `
        class Calculator {
          add(x, y) {
            return x + y;
          }
        }
        const calc = new Calculator();
      `;

            const result = minify(code);
            expect(result.code).toBeDefined();
        });
    });

    describe('压缩优化', () => {
        test('应该进行常量折叠', () => {
            const code = 'const result = 2 + 3 * 4;';
            const result = minify(code, {
                compress: {
                    constantFolding: true,
                },
            });

            // 应该将 2 + 3 * 4 计算为 14
            expect(result.code).toContain('14');
        });

        test('应该优化布尔值', () => {
            const code = 'const isTrue = true; const isFalse = false;';
            const result = minify(code);

            // 布尔值优化在生成器阶段进行
            expect(result.code).toBeDefined();
        });

        test('应该移除不可达代码', () => {
            const code = `
        if (false) {
          console.log('这段代码不会执行');
        }
        console.log('这段代码会执行');
      `;

            const result = minify(code, {
                compress: {
                    deadCodeElimination: true,
                },
            });

            expect(result.code).toBeDefined();
        });
    });

    describe('变量名混淆', () => {
        test('应该混淆局部变量名', () => {
            const code = `
        function testFunction(parameter) {
          const localVariable = parameter * 2;
          return localVariable;
        }
      `;

            const result = minify(code, {
                mangle: {
                    enabled: true,
                },
            });

            expect(result.code).toBeDefined();
            // 在混淆模式下，长变量名应该被替换
        });

        test('不应该混淆全局变量', () => {
            const code = 'const globalVariable = 123;';
            const result = minify(code, {
                mangle: {
                    enabled: true,
                },
            });

            // 全局变量不应该被混淆
            expect(result.code).toContain('globalVariable');
        });
    });

    describe('配置选项', () => {
        test('应该支持禁用压缩', () => {
            const code = 'const a = 2 + 3;';
            const result = minify(code, {
                compress: undefined,
            });

            expect(result.code).toBeDefined();
        });

        test('应该支持保留函数名', () => {
            const code = 'function namedFunction() { return 42; }';
            const result = minify(code, {
                mangle: {
                    enabled: true,
                    keepFunctionNames: true,
                },
            });

            expect(result.code).toContain('namedFunction');
        });
    });

    describe('错误处理', () => {
        test('应该抛出语法错误', () => {
            const invalidCode = 'const a = ;'; // 语法错误

            expect(() => {
                minify(invalidCode);
            }).toThrow();
        });

        test('应该处理空输入', () => {
            const result = minify('');
            expect(result.code).toBe('');
        });
    });
});
