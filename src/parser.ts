import { parse as acornParse } from 'acorn';
import { Program } from 'estree';
import { ParserOptions } from './types';

/**
 * JavaScript 解析器
 * 使用 Acorn 将 JavaScript 代码解析为 ESTree AST
 */
export class Parser {
    private options: ParserOptions;

    constructor(options: Partial<ParserOptions> = {}) {
        this.options = {
            sourceType: 'module',
            ecmaVersion: 2020,
            allowImportExportEverywhere: false,
            allowReturnOutsideFunction: false,
            ...options,
        };
    }

    /**
     * 解析 JavaScript 代码为 AST
     */
    parse(code: string): Program {
        try {
            const ast = acornParse(code, {
                ecmaVersion: this.options.ecmaVersion as any,
                sourceType: this.options.sourceType,
                allowImportExportEverywhere: this.options.allowImportExportEverywhere,
                allowReturnOutsideFunction: this.options.allowReturnOutsideFunction,
            }) as Program;

            return ast;
        } catch (error) {
            throw new Error(`解析错误: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 更新解析器选项
     */
    updateOptions(options: Partial<ParserOptions>): void {
        this.options = { ...this.options, ...options };
    }
}

/**
 * 便捷的解析函数
 */
export function parse(code: string, options?: Partial<ParserOptions>): Program {
    const parser = new Parser(options);
    return parser.parse(code);
}
