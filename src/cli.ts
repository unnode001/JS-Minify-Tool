#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import { JSMini, MinifyOptions } from './index';

const program = new Command();

program
    .name('jsmini')
    .description('高性能 JavaScript 代码压缩器')
    .version('1.0.0');

program
    .argument('[input]', '输入文件路径')
    .option('-o, --output <file>', '输出文件路径')
    .option('--compress', '启用压缩优化', true)
    .option('--mangle', '启用变量名混淆', false)
    .option('--source-map', '生成 Source Map', false)
    .option('--ecma <version>', 'ECMAScript 版本', '2020')
    .option('--keep-class-names', '保留类名', false)
    .option('--keep-function-names', '保留函数名', false)
    .option('--drop-console', '移除 console 语句', false)
    .option('--drop-debugger', '移除 debugger 语句', false)
    .action((input, options) => {
        try {
            // 读取输入
            let code: string;
            if (input) {
                if (!fs.existsSync(input)) {
                    console.error(`错误: 输入文件 "${input}" 不存在`);
                    process.exit(1);
                }
                code = fs.readFileSync(input, 'utf-8');
            } else {
                // 从标准输入读取
                code = fs.readFileSync(0, 'utf-8');
            }

            // 构建配置选项
            const minifyOptions: MinifyOptions = {
                compress: options.compress ? {
                    constantFolding: true,
                    deadCodeElimination: true,
                    booleanOptimization: true,
                    sequenceOptimization: true,
                    dropConsole: options.dropConsole,
                    dropDebugger: options.dropDebugger,
                } : undefined,
                mangle: options.mangle ? {
                    enabled: true,
                    keepClassNames: options.keepClassNames,
                    keepFunctionNames: options.keepFunctionNames,
                } : { enabled: false },
                output: {
                    sourceMap: options.sourceMap,
                    comments: false,
                },
                ecma: parseInt(options.ecma, 10),
            };

            // 执行压缩
            const jsmini = new JSMini(minifyOptions);
            const result = jsmini.minify(code);

            // 输出结果
            if (options.output) {
                // 写入文件
                fs.writeFileSync(options.output, result.code, 'utf-8');

                // 如果有 source map，也写入
                if (result.map && options.sourceMap) {
                    const mapFile = options.output + '.map';
                    fs.writeFileSync(mapFile, JSON.stringify(result.map), 'utf-8');
                }

                console.log(`压缩完成: ${options.output}`);

                // 显示压缩统计
                const originalSize = Buffer.byteLength(code, 'utf-8');
                const compressedSize = Buffer.byteLength(result.code, 'utf-8');
                const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

                console.log(`原始大小: ${formatBytes(originalSize)}`);
                console.log(`压缩后大小: ${formatBytes(compressedSize)}`);
                console.log(`节省: ${savings}%`);
            } else {
                // 输出到标准输出
                console.log(result.code);
            }

            // 显示警告
            if (result.warnings && result.warnings.length > 0) {
                console.warn('警告:');
                result.warnings.forEach(warning => {
                    console.warn(`  ${warning}`);
                });
            }

        } catch (error) {
            console.error(`错误: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        }
    });

// 添加示例命令
program
    .command('example')
    .description('显示使用示例')
    .action(() => {
        console.log('JSMini 使用示例:');
        console.log('');
        console.log('  # 压缩文件');
        console.log('  jsmini input.js -o output.min.js');
        console.log('');
        console.log('  # 启用变量名混淆');
        console.log('  jsmini input.js -o output.min.js --mangle');
        console.log('');
        console.log('  # 生成 Source Map');
        console.log('  jsmini input.js -o output.min.js --source-map');
        console.log('');
        console.log('  # 从标准输入读取');
        console.log('  cat input.js | jsmini > output.min.js');
        console.log('');
        console.log('  # 设置 ECMAScript 版本');
        console.log('  jsmini input.js -o output.min.js --ecma 2018');
    });

/**
 * 格式化字节大小
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 解析命令行参数
program.parse();
