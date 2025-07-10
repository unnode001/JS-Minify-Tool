import { generate as astringGenerate } from 'astring';
import { Program } from 'estree';
import { GeneratorOptions, MinifyResult } from './types';

/**
 * 代码生成器
 * 将优化后的 AST 转换成紧凑的 JavaScript 代码
 */
export class Generator {
    private options: GeneratorOptions;

    constructor(options: Partial<GeneratorOptions> = {}) {
        this.options = {
            format: {
                indent: {
                    style: '',
                    base: 0,
                },
                semicolons: false,
                quotes: 'single',
            },
            comments: false,
            sourceMap: false,
            ...options,
        };
    }

    /**
     * 生成代码
     */
    generate(ast: Program): MinifyResult {
        try {
            const result = astringGenerate(ast, {
                indent: this.options.format?.indent?.style || '',
                lineEnd: '',
                comments: this.options.comments === true,
            });

            return {
                code: this.postProcess(result),
                warnings: [],
            };
        } catch (error) {
            throw new Error(`代码生成错误: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 后处理优化代码
     */
    private postProcess(code: string): string {
        // 优化布尔值
        code = code.replace(/\btrue\b/g, '!0');
        code = code.replace(/\bfalse\b/g, '!1');

        // 优化 undefined
        code = code.replace(/\bundefined\b/g, 'void 0');

        // 移除不必要的分号
        code = code.replace(/;(\s*[}\]])/, '$1');

        // 移除多余的空格
        code = code.replace(/\s+/g, ' ');
        code = code.replace(/\s*([{}();,])\s*/g, '$1');

        return code.trim();
    }

    /**
     * 更新生成器选项
     */
    updateOptions(options: Partial<GeneratorOptions>): void {
        this.options = { ...this.options, ...options };
    }
}

/**
 * 便捷的生成函数
 */
export function generate(ast: Program, options?: Partial<GeneratorOptions>): MinifyResult {
    const generator = new Generator(options);
    return generator.generate(ast);
}
