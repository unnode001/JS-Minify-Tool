import { Generator } from './generator';
import { Parser } from './parser';
import { TransformEngine } from './transformer';
import { MinifyOptions, MinifyResult, ParserOptions } from './types';

/**
 * JSMini 主类
 * 高性能 JavaScript 代码压缩器
 */
export class JSMini {
    private parser: Parser;
    private transformer: TransformEngine;
    private generator: Generator;

    constructor(options: MinifyOptions = {}) {
        // 初始化各个组件
        const parserOptions: Partial<ParserOptions> = {
            ecmaVersion: options.ecma || 2020,
            sourceType: 'module',
        };

        this.parser = new Parser(parserOptions);
        this.transformer = new TransformEngine(options);
        this.generator = new Generator(options.output);
    }

    /**
     * 压缩 JavaScript 代码
     */
    minify(code: string): MinifyResult {
        try {
            // 1. 解析代码为 AST
            const ast = this.parser.parse(code);

            // 2. 转换和优化 AST
            const transformedAst = this.transformer.transform(ast);

            // 3. 生成压缩后的代码
            const result = this.generator.generate(transformedAst as any);

            return result;
        } catch (error) {
            throw new Error(`压缩失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 更新配置选项
     */
    updateOptions(options: Partial<MinifyOptions>): void {
        // 更新解析器选项
        if (options.ecma) {
            this.parser.updateOptions({ ecmaVersion: options.ecma });
        }

        // 更新转换器选项
        this.transformer.updateOptions(options);

        // 更新生成器选项
        if (options.output) {
            this.generator.updateOptions(options.output);
        }
    }

    /**
     * 获取当前配置
     */
    getOptions(): MinifyOptions {
        // 返回当前配置的副本
        return {
            // 这里应该从各个组件获取当前配置
            // 为了简化，返回默认配置
            compress: {
                constantFolding: true,
                deadCodeElimination: true,
                booleanOptimization: true,
                sequenceOptimization: true,
                dropConsole: false,
                dropDebugger: false,
            },
            mangle: {
                enabled: false,
                reservedNames: [],
                keepClassNames: false,
                keepFunctionNames: false,
            },
            output: {
                comments: false,
                sourceMap: false,
            },
            ecma: 2020,
        };
    }
}

/**
 * 便捷的压缩函数
 */
export function minify(code: string, options?: MinifyOptions): MinifyResult {
    const jsmini = new JSMini(options);
    return jsmini.minify(code);
}

// 导出主要类型和函数
export { Generator } from './generator';
export { Parser } from './parser';
export { ScopeManagerImpl as ScopeManager } from './scope';
export { TransformEngine } from './transformer';
export * from './types';

